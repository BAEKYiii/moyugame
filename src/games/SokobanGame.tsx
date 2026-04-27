import React, { useState, useCallback, useEffect } from 'react';

interface SokobanGameProps {
  onBack: () => void;
}

const GRID_WIDTH = 8;
const GRID_HEIGHT = 6;

const LEVEL = [
  '########',
  '#     .#',
  '# $@$. #',
  '# $  . #',
  '#   .  #',
  '########'
];

type Cell = 'wall' | 'floor' | 'target' | 'box' | 'player' | 'boxOnTarget' | 'playerOnTarget';

function SokobanGame({ onBack }: SokobanGameProps) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [moves, setMoves] = useState(0);
  const [boxesOnTarget, setBoxesOnTarget] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [isWin, setIsWin] = useState(false);

  const initGame = useCallback(() => {
    const newGrid: Cell[][] = [];
    let player: { x: number; y: number } = { x: 0, y: 0 };
    let targets = 0;

    for (let y = 0; y < LEVEL.length; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < LEVEL[y].length; x++) {
        const char = LEVEL[y][x];
        switch (char) {
          case '#':
            row.push('wall');
            break;
          case ' ':
            row.push('floor');
            break;
          case '.':
            row.push('target');
            targets++;
            break;
          case '$':
            row.push('box');
            break;
          case '@':
            row.push('player');
            player = { x, y };
            break;
          case '*':
            row.push('boxOnTarget');
            targets++;
            break;
          case '+':
            row.push('playerOnTarget');
            targets++;
            player = { x, y };
            break;
          default:
            row.push('floor');
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setPlayerPos(player);
    setTotalTargets(targets);
    setBoxesOnTarget(0);
    setMoves(0);
    setIsWin(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const countBoxesOnTarget = useCallback((newGrid: Cell[][]) => {
    let count = 0;
    for (let y = 0; y < newGrid.length; y++) {
      for (let x = 0; x < newGrid[y].length; x++) {
        if (newGrid[y][x] === 'boxOnTarget') {
          count++;
        }
      }
    }
    return count;
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    if (isWin) return;

    const { x, y } = playerPos;
    const newX = x + dx;
    const newY = y + dy;

    if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) return;

    const currentCell = grid[y][x];
    const targetCell = grid[newY][newX];

    if (targetCell === 'wall') return;

    const newGrid = grid.map(row => [...row]);

    if (targetCell === 'box' || targetCell === 'boxOnTarget') {
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;

      if (boxNewX < 0 || boxNewX >= GRID_WIDTH || boxNewY < 0 || boxNewY >= GRID_HEIGHT) return;

      const boxTargetCell = grid[boxNewY][boxNewX];
      if (boxTargetCell === 'wall' || boxTargetCell === 'box' || boxTargetCell === 'boxOnTarget') return;

      if (boxTargetCell === 'target') {
        newGrid[boxNewY][boxNewX] = 'boxOnTarget';
      } else {
        newGrid[boxNewY][boxNewX] = 'box';
      }

      if (targetCell === 'boxOnTarget') {
        newGrid[newY][newX] = 'target';
      } else {
        newGrid[newY][newX] = 'floor';
      }
    }

    if (targetCell === 'target') {
      newGrid[newY][newX] = 'playerOnTarget';
    } else if (targetCell === 'floor' || targetCell === 'box') {
      newGrid[newY][newX] = 'player';
    }

    if (currentCell === 'playerOnTarget') {
      newGrid[y][x] = 'target';
    } else {
      newGrid[y][x] = 'floor';
    }

    setGrid(newGrid);
    setPlayerPos({ x: newX, y: newY });
    setMoves(prev => prev + 1);

    const newBoxesOnTarget = countBoxesOnTarget(newGrid);
    setBoxesOnTarget(newBoxesOnTarget);

    if (newBoxesOnTarget === totalTargets) {
      setIsWin(true);
    }
  }, [playerPos, grid, isWin, totalTargets, countBoxesOnTarget]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move(1, 0);
          break;
        case 'r':
        case 'R':
          initGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, initGame]);

  const getCellEmoji = (cell: Cell) => {
    switch (cell) {
      case 'wall': return '🧱';
      case 'floor': return '⬜';
      case 'target': return '🔴';
      case 'box': return '📦';
      case 'player': return '😀';
      case 'boxOnTarget': return '✅';
      case 'playerOnTarget': return '😀';
      default: return '⬜';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>推箱子</h2>
        <div style={styles.stats}>
          <span>步数: {moves}</span>
          <span style={styles.separator}>|</span>
          <span>完成: {boxesOnTarget}/{totalTargets}</span>
        </div>
      </div>

      <div style={styles.gameBoard}>
        {grid.map((row, y) => (
          <div key={y} style={styles.row}>
            {row.map((cell, x) => (
              <div key={x} style={styles.cell}>
                {getCellEmoji(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {isWin && (
        <div style={styles.winOverlay}>
          <div style={styles.winMessage}>
            <h2>🎉 恭喜通关！</h2>
            <p>用时 {moves} 步</p>
            <button onClick={initGame} style={styles.playAgainButton}>再玩一次</button>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <p style={styles.hint}>使用 方向键 或 WASD 移动，按 R 重新开始</p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '500px',
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '24px',
    margin: '0',
    color: '#333',
  },
  stats: {
    fontSize: '16px',
    color: '#666',
  },
  separator: {
    margin: '0 10px',
  },
  gameBoard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ddd',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  row: {
    display: 'flex',
  },
  cell: {
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    backgroundColor: '#eee',
    border: '1px solid #ccc',
  },
  winOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  winMessage: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  playAgainButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  controls: {
    marginTop: '20px',
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    fontSize: '14px',
  },
};

export default SokobanGame;