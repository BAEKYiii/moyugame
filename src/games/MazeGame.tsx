import React, { useState, useCallback, useEffect } from 'react';

interface MazeGameProps {
  onBack: () => void;
}

const GRID_SIZE = 10;
const CELL_SIZE = 40;

function MazeGame({ onBack }: MazeGameProps) {
  const [maze, setMaze] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const generateMaze = useCallback(() => {
    // Simple maze generation using depth-first search
    const newMaze: number[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(1));
    
    const stack: { x: number; y: number }[] = [];
    const startX = 0;
    const startY = 0;
    newMaze[startY][startX] = 0;
    stack.push({ x: startX, y: startY });
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const { x, y } = current;
      
      const directions = [
        { dx: 0, dy: -2 }, // up
        { dx: 2, dy: 0 },   // right
        { dx: 0, dy: 2 },   // down
        { dx: -2, dy: 0 }   // left
      ];
      
      const validDirections = directions.filter(({ dx, dy }) => {
        const newX = x + dx;
        const newY = y + dy;
        return newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && newMaze[newY][newX] === 1;
      });
      
      if (validDirections.length > 0) {
        const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        newMaze[y + dir.dy / 2][x + dir.dx / 2] = 0;
        newMaze[newY][newX] = 0;
        stack.push({ x: newX, y: newY });
      } else {
        stack.pop();
      }
    }
    
    // Ensure end is reachable
    newMaze[GRID_SIZE - 1][GRID_SIZE - 1] = 0;
    
    // Add some walls based on difficulty
    if (difficulty === 'medium') {
      // Add 10% extra walls
      for (let i = 0; i < GRID_SIZE * GRID_SIZE * 0.1; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if ((x !== 0 || y !== 0) && (x !== GRID_SIZE - 1 || y !== GRID_SIZE - 1)) {
          newMaze[y][x] = 1;
        }
      }
    } else if (difficulty === 'hard') {
      // Add 20% extra walls
      for (let i = 0; i < GRID_SIZE * GRID_SIZE * 0.2; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if ((x !== 0 || y !== 0) && (x !== GRID_SIZE - 1 || y !== GRID_SIZE - 1)) {
          newMaze[y][x] = 1;
        }
      }
    }
    
    return newMaze;
  }, [difficulty]);

  const initGame = useCallback(() => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setEndPos({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
    setGameOver(false);
    setMoves(0);
  }, [generateMaze]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameOver) return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      if (maze[newY][newX] === 0) {
        setPlayerPos({ x: newX, y: newY });
        setMoves(prev => prev + 1);
        
        if (newX === endPos.x && newY === endPos.y) {
          setGameOver(true);
        }
      }
    }
  }, [playerPos, endPos, maze, gameOver]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>迷宫游戏</h2>
        <div style={styles.stats}>
          <span>步数: {moves}</span>
        </div>
      </div>

      <div style={styles.difficultySelector}>
        <span style={styles.difficultyLabel}>难度：</span>
        <button
          onClick={() => setDifficulty('easy')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'easy' ? '#3498db' : '#bdc3c7',
            color: difficulty === 'easy' ? 'white' : '#333',
          }}
        >
          简单
        </button>
        <button
          onClick={() => setDifficulty('medium')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'medium' ? '#f39c12' : '#bdc3c7',
            color: difficulty === 'medium' ? 'white' : '#333',
          }}
        >
          中等
        </button>
        <button
          onClick={() => setDifficulty('hard')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'hard' ? '#e74c3c' : '#bdc3c7',
            color: difficulty === 'hard' ? 'white' : '#333',
          }}
        >
          困难
        </button>
      </div>

      <div style={{
        ...styles.gameBoard,
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
      }}>
        {maze.map((row, y) => (
          <div key={y} style={styles.row}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  ...styles.cell,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  backgroundColor: cell === 1 ? '#34495e' : '#ecf0f1',
                  position: 'relative',
                }}
              >
                {x === 0 && y === 0 && (
                  <span style={styles.start}>S</span>
                )}
                {x === GRID_SIZE - 1 && y === GRID_SIZE - 1 && (
                  <span style={styles.end}>E</span>
                )}
                {x === playerPos.x && y === playerPos.y && (
                  <span style={styles.player}>😀</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div style={styles.winOverlay}>
          <div style={styles.winMessage}>
            <h2>🎉 恭喜通关！</h2>
            <p>用时 {moves} 步</p>
            <button onClick={initGame} style={styles.playAgainButton}>再玩一次</button>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <p style={styles.hint}>使用 方向键 或 WASD 移动</p>
        <p style={styles.subHint}>目标：从 S 走到 E</p>
        <button onClick={initGame} style={styles.resetButton}>重新开始</button>
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
    backgroundColor: '#f5f6fa',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '450px',
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
  difficultySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  difficultyLabel: {
    color: '#666',
    fontSize: '14px',
  },
  difficultyButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  gameBoard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#95a5a6',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  row: {
    display: 'flex',
  },
  cell: {
    margin: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  start: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  end: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  player: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '24px',
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
    margin: '5px 0',
  },
  subHint: {
    color: '#27ae60',
    fontSize: '14px',
    margin: '5px 0',
    fontWeight: 'bold',
  },
  resetButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default MazeGame;