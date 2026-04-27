import React, { useState, useCallback, useEffect } from 'react';

interface HuaRongDaoGameProps {
  onBack: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: { size: 3, cellSize: 80 },
  medium: { size: 4, cellSize: 60 },
  hard: { size: 5, cellSize: 48 },
};

type Tile = {
  value: number;
  row: number;
  col: number;
  isEmpty: boolean;
};

function HuaRongDaoGame({ onBack }: HuaRongDaoGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [bestScores, setBestScores] = useState<{ [key in Difficulty]: number }>(() => {
    return {
      easy: parseInt(localStorage.getItem('puzzle_easy') || '0'),
      medium: parseInt(localStorage.getItem('puzzle_medium') || '0'),
      hard: parseInt(localStorage.getItem('puzzle_hard') || '0'),
    };
  });
  const [clickedTile, setClickedTile] = useState<{ col: number; row: number } | null>(null);

  const { size, cellSize } = DIFFICULTY_CONFIG[difficulty];
  const TOTAL_TILES = size * size;

  const initGame = useCallback(() => {
    const newTiles: Tile[] = [];
    const numbers = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);
    numbers.push(0); // 0 表示空白格

    // 随机打乱数字
    let shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
    let attempts = 0;
    
    // 确保拼图可解
    while (!isSolvable(shuffledNumbers, size) && attempts < 100) {
      shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
      attempts++;
    }

    for (let i = 0; i < TOTAL_TILES; i++) {
      const value = shuffledNumbers[i];
      newTiles.push({
        value,
        row: Math.floor(i / size),
        col: i % size,
        isEmpty: value === 0,
      });
    }

    setTiles(newTiles);
    setMoves(0);
    setIsWin(false);
  }, [size, TOTAL_TILES]);

  const isSolvable = (numbers: number[], gridSize: number): boolean => {
    let inversionCount = 0;
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] !== 0 && numbers[j] !== 0 && numbers[i] > numbers[j]) {
          inversionCount++;
        }
      }
    }

    if (gridSize % 2 === 1) {
      return inversionCount % 2 === 0;
    } else {
      const emptyRow = Math.floor(numbers.indexOf(0) / gridSize);
      return (inversionCount + emptyRow) % 2 === 1;
    }
  };

  const checkWin = useCallback((currentTiles: Tile[]) => {
    for (let i = 0; i < TOTAL_TILES; i++) {
      const expectedValue = i < TOTAL_TILES - 1 ? i + 1 : 0;
      const tile = currentTiles.find(t => t.row === Math.floor(i / size) && t.col === i % size);
      if (!tile || tile.value !== expectedValue) {
        return false;
      }
    }
    return true;
  }, [size, TOTAL_TILES]);

  const handleTileClick = useCallback((clickedTile: Tile) => {
    if (isWin || clickedTile.isEmpty) return;

    const emptyTile = tiles.find(t => t.isEmpty);
    if (!emptyTile) return;

    const isAdjacent = (
      (Math.abs(clickedTile.row - emptyTile.row) === 1 && clickedTile.col === emptyTile.col) ||
      (Math.abs(clickedTile.col - emptyTile.col) === 1 && clickedTile.row === emptyTile.row)
    );

    if (isAdjacent) {
      const newTiles = tiles.map(tile => {
        if (tile.value === clickedTile.value) {
          return { ...tile, row: emptyTile.row, col: emptyTile.col };
        }
        if (tile.isEmpty) {
          return { ...tile, row: clickedTile.row, col: clickedTile.col };
        }
        return tile;
      });

      setTiles(newTiles);
      setMoves(prev => prev + 1);

      if (checkWin(newTiles)) {
        setIsWin(true);
        const currentBest = bestScores[difficulty];
        if (currentBest === 0 || moves + 1 < currentBest) {
          const newBestScores = {
            ...bestScores,
            [difficulty]: moves + 1,
          };
          setBestScores(newBestScores);
          localStorage.setItem(`puzzle_${difficulty}`, String(moves + 1));
        }
      }
    }
  }, [tiles, isWin, checkWin, moves, bestScores, difficulty]);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  const handleNextLevel = useCallback(() => {
    if (difficulty === 'easy') {
      setDifficulty('medium');
    } else if (difficulty === 'medium') {
      setDifficulty('hard');
    } else {
      setDifficulty('easy');
    }
  }, [difficulty]);

  const setTileClick = useCallback((col: number | null, row: number | null) => {
    setClickedTile(col !== null && row !== null ? { col, row } : null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame, difficulty]);

  const getTileStyle = (value: number) => {
    if (value === 0) {
      return {
        backgroundColor: '#ecf0f1',
        border: '1px solid #bdc3c7',
      };
    }

    const woodStyles = [
      {
        backgroundColor: '#8B4513',
        backgroundImage: 'linear-gradient(90deg, rgba(139,69,19,1) 0%, rgba(160,82,45,1) 50%, rgba(139,69,19,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#A0522D',
        backgroundImage: 'linear-gradient(90deg, rgba(160,82,45,1) 0%, rgba(205,133,63,1) 50%, rgba(160,82,45,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#CD853F',
        backgroundImage: 'linear-gradient(90deg, rgba(205,133,63,1) 0%, rgba(222,184,135,1) 50%, rgba(205,133,63,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#DEB887',
        backgroundImage: 'linear-gradient(90deg, rgba(222,184,135,1) 0%, rgba(210,180,140,1) 50%, rgba(222,184,135,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#D2B48C',
        backgroundImage: 'linear-gradient(90deg, rgba(210,180,140,1) 0%, rgba(188,143,143,1) 50%, rgba(210,180,140,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#BC8F8F',
        backgroundImage: 'linear-gradient(90deg, rgba(188,143,143,1) 0%, rgba(245,222,179,1) 50%, rgba(188,143,143,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#F5DEB3',
        backgroundImage: 'linear-gradient(90deg, rgba(245,222,179,1) 0%, rgba(255,222,173,1) 50%, rgba(245,222,179,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
      {
        backgroundColor: '#FFDEAD',
        backgroundImage: 'linear-gradient(90deg, rgba(255,222,173,1) 0%, rgba(245,222,179,1) 50%, rgba(255,222,173,1) 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
      },
    ];

    return woodStyles[(value - 1) % woodStyles.length];
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>数字拼图</h2>
        <div style={styles.stats}>
          <span>步数: {moves}</span>
          {bestScores[difficulty] > 0 && <span style={styles.separator}>|</span>}
          {bestScores[difficulty] > 0 && <span>最佳: {bestScores[difficulty]}</span>}
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
          3×3
        </button>
        <button
          onClick={() => handleDifficultyChange('medium')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'medium' ? '#f39c12' : '#bdc3c7',
            color: difficulty === 'medium' ? 'white' : '#333',
          }}
        >
          4×4
        </button>
        <button
          onClick={() => handleDifficultyChange('hard')}
          style={{
            ...styles.difficultyButton,
            backgroundColor: difficulty === 'hard' ? '#e74c3c' : '#bdc3c7',
            color: difficulty === 'hard' ? 'white' : '#333',
          }}
        >
          5×5
        </button>
      </div>

      <div style={{
        ...styles.gameBoard,
        width: size * cellSize + 20,
      }}>
        {Array.from({ length: size }, (_, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {Array.from({ length: size }, (_, colIndex) => {
              const tile = tiles.find(t => t.row === rowIndex && t.col === colIndex);
              return (
                <div
                  key={colIndex}
                  onClick={() => tile && handleTileClick(tile)}
                  style={{
                    ...styles.tile,
                    width: cellSize - 4,
                    height: cellSize - 4,
                    ...(tile ? getTileStyle(tile.value) : { backgroundColor: '#ecf0f1' }),
                    cursor: tile && !tile.isEmpty ? 'pointer' : 'default',
                    transform: clickedTile && clickedTile.col === colIndex && clickedTile.row === rowIndex 
                      ? 'translateZ(0) scale(0.95)' 
                      : 'translateZ(0)',
                    boxShadow: clickedTile && clickedTile.col === colIndex && clickedTile.row === rowIndex
                      ? '0 1px 2px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.2), inset 0 0 10px rgba(0,0,0,0.3)',
                    willChange: 'transform, box-shadow',
                  }}
                  onMouseDown={() => tile && !tile.isEmpty && setTileClick(colIndex, rowIndex)}
                  onMouseUp={() => setTileClick(null, null)}
                  onMouseLeave={() => setTileClick(null, null)}
                >
                  {tile && tile.value > 0 && (
                    <span style={{
                      ...styles.tileValue,
                      fontSize: cellSize > 60 ? '24px' : cellSize > 40 ? '20px' : '16px',
                    }}>
                      {tile.value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isWin && (
        <div style={styles.winOverlay}>
          <div style={styles.winMessage}>
            <h2>🎉 恭喜通关！</h2>
            <p>用时 {moves} 步</p>
            {bestScores[difficulty] > 0 && <p>最佳记录: {bestScores[difficulty]} 步</p>}
            <div style={styles.winButtons}>
              <button onClick={initGame} style={styles.playAgainButton}>再玩一次</button>
              <button onClick={handleNextLevel} style={styles.nextLevelButton}>下一关</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <p style={styles.hint}>点击与空白格相邻的数字方块进行移动</p>
        <p style={styles.subHint}>目标：将数字按1,2,3...顺序排列</p>
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
    color: '#333',
  },
  stats: {
    fontSize: '16px',
    color: '#666',
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
    backgroundColor: '#bdc3c7',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  row: {
    display: 'flex',
  },
  tile: {
    margin: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    userSelect: 'none',
    position: 'relative',
  },
  tileValue: {
    color: 'white',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
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
  winButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  playAgainButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  nextLevelButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
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

export default HuaRongDaoGame;