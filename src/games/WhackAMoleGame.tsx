import React, { useState, useCallback, useEffect, useRef } from 'react';

// 游戏配置
const GRID_SIZE = 3;
const GAME_DURATION = 30; // 30秒
const MOLE_SHOW_TIME = 1000; // 1秒
const MOLE_HIDE_TIME = 500; // 0.5秒

interface WhackAMoleGameProps {
  onBack: () => void;
}

function WhackAMoleGame({ onBack }: WhackAMoleGameProps) {
  const [grid, setGrid] = useState<(number | null)[][]>(() => {
    const newGrid: (number | null)[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid.push(Array(GRID_SIZE).fill(null));
    }
    return newGrid;
  });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 随机显示地鼠
  const showRandomMole = useCallback(() => {
    if (!gameStarted || gameOver) return;

    // 直接创建新网格，不依赖外部grid状态
    const newGrid: (number | null)[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid.push(Array(GRID_SIZE).fill(null));
    }

    // 随机选择一个位置显示地鼠
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    newGrid[row][col] = Math.floor(Math.random() * 3) + 1; // 1-3的分数

    setGrid(newGrid);

    // 一段时间后隐藏地鼠
    setTimeout(() => {
      setGrid(prevGrid => {
        const updatedGrid = prevGrid.map(row => [...row]);
        updatedGrid[row][col] = null;
        return updatedGrid;
      });
    }, MOLE_SHOW_TIME);
  }, [gameStarted, gameOver]);

  // 开始游戏
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameStarted(true);
    setGameOver(false);

    // 清除之前的定时器
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (moleIntervalRef.current) {
      clearInterval(moleIntervalRef.current);
    }

    // 开始计时
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = null;
          }
          if (moleIntervalRef.current) {
            clearInterval(moleIntervalRef.current);
            moleIntervalRef.current = null;
          }
          setGameOver(true);
          setGameStarted(false);
          setHighScore(prevHigh => Math.max(prevHigh, score));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 开始随机显示地鼠
    showRandomMole();
    moleIntervalRef.current = setInterval(showRandomMole, MOLE_SHOW_TIME + MOLE_HIDE_TIME);
  }, [showRandomMole, score]);

  // 点击地鼠
  const whackMole = useCallback((row: number, col: number) => {
    setGrid(prevGrid => {
      if (!gameStarted || gameOver || prevGrid[row][col] === null) return prevGrid;

      const points = prevGrid[row][col];
      setScore(prev => prev + points);

      // 隐藏被击中的地鼠
      const newGrid = prevGrid.map(row => [...row]);
      newGrid[row][col] = null;
      return newGrid;
    });
  }, [gameStarted, gameOver]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
      }
    };
  }, []);

  // 渲染游戏板
  const renderBoard = () => {
    return (
      <div
        className="whack-a-mole-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '15px',
          width: '450px',
          height: '450px',
          margin: '2rem auto',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(106, 90, 205, 0.5)'
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="mole-hole"
              onClick={() => whackMole(rowIndex, colIndex)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#8B4513',
                borderRadius: '50%',
                cursor: gameStarted && !gameOver ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              {cell !== null && (
                <div
                  className="mole"
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '4rem',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  🐭
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="game-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    }}>
      <div className="game-header" style={{
        width: '100%',
        maxWidth: '800px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="game-title-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button 
            className="back-btn" 
            onClick={onBack}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6a5acd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4ac0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6a5acd'}
          >
            ← 返回
          </button>
          <h1 className="game-title" style={{
            color: '#ffffff',
            fontSize: '36px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            打地鼠
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>分数</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{score}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>最高分</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{highScore}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>时间</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start" style={{
          textAlign: 'center',
          margin: '2rem 0'
        }}>
          <button 
            className="start-btn"
            onClick={startGame}
            style={{
              padding: '15px 30px',
              backgroundColor: '#6a5acd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4ac0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6a5acd'}
          >
            开始游戏
          </button>
        </div>
      )}

      {gameOver && (
        <div className="game-over" style={{
          textAlign: 'center',
          margin: '2rem 0',
          color: '#ffffff'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>游戏结束！</h2>
          <p style={{ fontSize: '20px', marginBottom: '20px' }}>最终分数: {score}</p>
          <button 
            className="restart-btn"
            onClick={startGame}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6a5acd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4ac0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6a5acd'}
          >
            重新开始
          </button>
        </div>
      )}

      {renderBoard()}

      <div className="game-info" style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#ffffff',
        opacity: 0.7,
        maxWidth: '600px'
      }}>
        <h3>游戏规则：</h3>
        <p>1. 点击出现的地鼠获得分数</p>
        <p>2. 游戏时间为30秒</p>
        <p>3. 不同地鼠可能有不同的分数</p>
        <p>4. 尽可能在时间结束前获得最高分</p>
      </div>
    </div>
  );
}

export default WhackAMoleGame;