import React, { useState, useEffect, useCallback } from 'react';

// 游戏配置
const GRID_SIZE = 4;
const WINNING_TILE = 2048;

interface Game2048Props {
  onBack: () => void;
}

function Game2048({ onBack }: Game2048Props) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // 初始化游戏
  const initGame = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
  }, []);

  // 添加随机方块
  const addRandomTile = useCallback((currentGrid: number[][]) => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }, []);

  // 移动方块
  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver || gameWon) return;

    let moved = false;
    const newGrid = grid.map(row => [...row]);

    if (direction === 'left' || direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = direction === 'left' ? newGrid[i] : newGrid[i].reverse();
        const filtered = row.filter(val => val !== 0);
        const merged = [];
        
        for (let j = 0; j < filtered.length; j++) {
          if (j < filtered.length - 1 && filtered[j] === filtered[j + 1]) {
            const mergedValue = filtered[j] * 2;
            merged.push(mergedValue);
            setScore(prev => prev + mergedValue);
            j++;
          } else {
            merged.push(filtered[j]);
          }
        }
        
        const newRow = [...merged, ...Array(GRID_SIZE - merged.length).fill(0)];
        if (direction === 'right') {
          newRow.reverse();
        }
        
        if (newRow.join(',') !== row.join(',')) {
          moved = true;
        }
        
        newGrid[i] = newRow;
      }
    } else {
      for (let j = 0; j < GRID_SIZE; j++) {
        const col = direction === 'up' 
          ? newGrid.map(row => row[j])
          : newGrid.map(row => row[j]).reverse();
        const filtered = col.filter(val => val !== 0);
        const merged = [];
        
        for (let i = 0; i < filtered.length; i++) {
          if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
            const mergedValue = filtered[i] * 2;
            merged.push(mergedValue);
            setScore(prev => prev + mergedValue);
            i++;
          } else {
            merged.push(filtered[i]);
          }
        }
        
        const newCol = [...merged, ...Array(GRID_SIZE - merged.length).fill(0)];
        if (direction === 'down') {
          newCol.reverse();
        }
        
        if (newCol.join(',') !== col.join(',')) {
          moved = true;
        }
        
        for (let i = 0; i < GRID_SIZE; i++) {
          newGrid[i][j] = newCol[i];
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      checkGameOver(newGrid);
    }
  }, [grid, gameOver, gameWon, addRandomTile]);

  // 检查游戏结束
  const checkGameOver = useCallback((currentGrid: number[][]) => {
    let hasEmptyCell = false;
    let canMerge = false;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          hasEmptyCell = true;
        }
        
        if (i < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i + 1][j]) {
          canMerge = true;
        }
        if (j < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i][j + 1]) {
          canMerge = true;
        }
      }
    }
    
    if (!hasEmptyCell && !canMerge) {
      setGameOver(true);
    }
    
    if (currentGrid.some(row => row.includes(WINNING_TILE))) {
      setGameWon(true);
    }
  }, []);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          move('left');
          break;
        case 'ArrowRight':
          move('right');
          break;
        case 'ArrowUp':
          move('up');
          break;
        case 'ArrowDown':
          move('down');
          break;
        case 'r':
          initGame();
          break;
        case 'Escape':
          onBack();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, initGame, onBack]);

  // 更新最高分
  useEffect(() => {
    setBestScore(prev => Math.max(prev, score));
  }, [score]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 获取方块颜色
  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    return colors[value] || '#3c3a32';
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-container">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <h1 className="game-title">2048</h1>
        </div>
        <div className="game-stats">
          <div className="stat-item">
            <span>分数</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span>最高分</span>
            <span className="stat-value">{bestScore}</span>
          </div>
        </div>
      </div>

      <div 
        className="game2048-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '10px',
          maxWidth: '400px',
          margin: '2rem auto',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      >
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="game2048-tile"
              style={{
                backgroundColor: getTileColor(cell),
                color: cell <= 4 ? '#776e65' : '#f9f6f2',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: cell >= 1000 ? '1.5rem' : cell >= 100 ? '1.2rem' : '1.8rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              {cell || ''}
            </div>
          ))
        )}
      </div>

      <div className="control-buttons">
        <button className="control-btn" onClick={() => move('left')}>←</button>
        <button className="control-btn" onClick={() => move('up')}>↑</button>
        <button className="control-btn" onClick={() => move('down')}>↓</button>
        <button className="control-btn" onClick={() => move('right')}>→</button>
        <button className="control-btn" onClick={initGame}>🔄</button>
      </div>

      {gameOver && (
        <div className="game-over">
          <h2>游戏结束</h2>
          <p>最终分数: {score}</p>
          <div>
            <button className="btn btn-primary" onClick={initGame}>重新开始</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}

      {gameWon && (
        <div className="game-over">
          <h2>🎉 恭喜获胜！</h2>
          <p>你成功达到了2048！</p>
          <p>最终分数: {score}</p>
          <div>
            <button className="btn btn-primary" onClick={initGame}>再玩一次</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}

      <div className="game-info" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
        <p>使用方向键移动方块</p>
        <p>相同数字的方块会合并，目标是达到2048</p>
        <p>R键重新开始，ESC键返回主菜单</p>
      </div>
    </div>
  );
}

export default Game2048;