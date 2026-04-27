import React, { useState, useCallback, useEffect } from 'react';

interface LightsOutGameProps {
  onBack: () => void;
}

const GRID_SIZE = 5;

function LightsOutGame({ onBack }: LightsOutGameProps) {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem('lightsout_best');
    return saved ? parseInt(saved) : 0;
  });
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const initGame = useCallback(() => {
    const newGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(false)
    );

    const initialClicks = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8;

    for (let i = 0; i < initialClicks; i++) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      toggleCell(newGrid, row, col, false);
    }

    const hasLightsOn = newGrid.some(row => row.some(cell => cell));
    if (!hasLightsOn) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      toggleCell(newGrid, row, col, false);
    }

    setGrid(newGrid);
    setMoves(0);
    setIsWin(false);
  }, [difficulty]);

  const toggleCell = (targetGrid: boolean[][], row: number, col: number, countMove: boolean = true) => {
    const directions = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        targetGrid[newRow][newCol] = !targetGrid[newRow][newCol];
      }
    });
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWin = useCallback((currentGrid: boolean[][]): boolean => {
    return currentGrid.every(row => row.every(cell => !cell));
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isWin) return;

    const newGrid = grid.map(r => [...r]);
    toggleCell(newGrid, row, col);

    setGrid(newGrid);
    setMoves(prev => prev + 1);

    if (checkWin(newGrid)) {
      setIsWin(true);
      const newMoves = moves + 1;
      if (bestScore === 0 || newMoves < bestScore) {
        setBestScore(newMoves);
        localStorage.setItem('lightsout_best', String(newMoves));
      }
    }
  }, [grid, isWin, moves, bestScore, checkWin]);

  const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
  }, []);

  useEffect(() => {
    initGame();
  }, [difficulty, initGame]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>点灯游戏</h2>
        <div style={styles.stats}>
          <span>步数: {moves}</span>
          {bestScore > 0 && <span style={styles.separator}>|</span>}
          {bestScore > 0 && <span>最佳: {bestScore}</span>}
        </div>
      </div>

      <div style={styles.difficultySelector}>
        <span style={styles.difficultyLabel}>难度：</span>
        <button
          onClick={() => handleDifficultyChange('easy')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'easy' ? '#3498db' : '#bdc3c7',
            color: difficulty === 'easy' ? 'white' : '#333',
          }}
        >
          简单
        </button>
        <button
          onClick={() => handleDifficultyChange('medium')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'medium' ? '#f39c12' : '#bdc3c7',
            color: difficulty === 'medium' ? 'white' : '#333',
          }}
        >
          中等
        </button>
        <button
          onClick={() => handleDifficultyChange('hard')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'hard' ? '#e74c3c' : '#bdc3c7',
            color: difficulty === 'hard' ? 'white' : '#333',
          }}
        >
          困难
        </button>
      </div>

      <div style={styles.gameBoard}>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  ...styles.cell,
                  backgroundColor: cell ? '#f1c40f' : '#2c3e50',
                  boxShadow: cell
                    ? '0 0 20px rgba(241, 196, 15, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)'
                    : 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {cell && '💡'}
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
            {bestScore > 0 && <p>最佳记录: {bestScore} 步</p>}
            <button onClick={initGame} style={styles.playAgainButton}>再玩一次</button>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <p style={styles.hint}>点击任意灯会反转它及上下左右灯的状态</p>
        <p style={styles.subHint}>目标：关闭所有灯</p>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '400px',
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
    color: '#fff',
  },
  stats: {
    fontSize: '16px',
    color: '#bdc3c7',
  },
  separator: {
    margin: '0 10px',
  },
  difficultySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  difficultyLabel: {
    color: '#bdc3c7',
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
    backgroundColor: '#16213e',
    padding: '15px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  row: {
    display: 'flex',
  },
  cell: {
    width: '60px',
    height: '60px',
    margin: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid #0f3460',
  },
  winOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  winMessage: {
    backgroundColor: '#16213e',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '2px solid #e94560',
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
    color: '#bdc3c7',
    fontSize: '14px',
    margin: '5px 0',
  },
  subHint: {
    color: '#e94560',
    fontSize: '14px',
    margin: '5px 0',
    fontWeight: 'bold',
  },
  resetButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default LightsOutGame;