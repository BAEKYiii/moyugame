import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 700;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 10;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 25;
const BRICK_ROWS = 6;
const BRICK_COLS = 6;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = (BOARD_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING))) / 2;

// 位置类型
type Position = { x: number; y: number };

// 速度类型
type Velocity = { dx: number; dy: number };

// 砖块类型
type Brick = { 
  id: number;
  x: number; 
  y: number; 
  status: number;
  color: string;
};

interface BreakoutGameProps {
  onBack: () => void;
}

function BreakoutGame({ onBack }: BreakoutGameProps) {
  // 游戏状态
  const [paddleX, setPaddleX] = useState((BOARD_WIDTH - PADDLE_WIDTH) / 2);
  const [ball, setBall] = useState<Position>({ x: BOARD_WIDTH / 2, y: BOARD_HEIGHT - 50 });
  const [velocity, setVelocity] = useState<Velocity>({ dx: 3, dy: -3 });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 鼠标位置引用
  const mouseXRef = useRef<number>(0);
  // 动画帧引用
  const animationFrameRef = useRef<number>();

  // 颜色数组
  const BRICK_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FFEAA7', '#DDA0DD'
  ];

  // 初始化砖块
  const initBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    let brickId = 0;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        newBricks.push({
          id: brickId++,
          x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          status: 1,
          color: BRICK_COLORS[r % BRICK_COLORS.length]
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // 重置游戏
  const resetGame = useCallback(() => {
    setPaddleX((BOARD_WIDTH - PADDLE_WIDTH) / 2);
    setBall({ x: BOARD_WIDTH / 2, y: BOARD_HEIGHT - 50 });
    setVelocity({ dx: 3, dy: -3 });
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setIsRunning(true);
    setIsPaused(false);
    initBricks();
  }, [initBricks]);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!isRunning || isPaused) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    setBall(prevBall => {
      let newX = prevBall.x + velocity.dx;
      let newY = prevBall.y + velocity.dy;
      let newVelocity = { ...velocity };
      let newBricks = [...bricks];
      let newScore = score;
      let newHighScore = highScore;
      let newLives = lives;
      let newGameOver = gameOver;
      let newGameWon = gameWon;

      // 边界碰撞检测
      if (newX + BALL_RADIUS > BOARD_WIDTH || newX - BALL_RADIUS < 0) {
        newVelocity.dx = -newVelocity.dx * 0.95;
        // 确保球不会完全垂直移动
        if (Math.abs(newVelocity.dx) < 1.5) {
          newVelocity.dx = Math.sign(newVelocity.dx) * 1.5;
        }
        newX = newX + BALL_RADIUS > BOARD_WIDTH 
          ? BOARD_WIDTH - BALL_RADIUS 
          : BALL_RADIUS;
      }
      
      if (newY - BALL_RADIUS < 0) {
        newVelocity.dy = -newVelocity.dy * 0.95;
        // 确保球不会完全水平移动
        if (Math.abs(newVelocity.dy) < 1.5) {
          newVelocity.dy = Math.sign(newVelocity.dy) * 1.5;
        }
        newY = BALL_RADIUS;
      }
      
      if (newY + BALL_RADIUS > BOARD_HEIGHT) {
        // 球掉落，减少生命值
        newLives = lives - 1;
        if (newLives === 0) {
          newGameOver = true;
          setIsRunning(false);
        } else {
          // 重置球的位置和速度
          newX = BOARD_WIDTH / 2;
          newY = BOARD_HEIGHT - 50;
          newVelocity = { dx: 3, dy: -3 };
        }
      }

      //  paddle 碰撞检测
      if (
        newY + BALL_RADIUS > BOARD_HEIGHT - PADDLE_HEIGHT &&
        newY - BALL_RADIUS < BOARD_HEIGHT &&
        newX + BALL_RADIUS > paddleX &&
        newX - BALL_RADIUS < paddleX + PADDLE_WIDTH
      ) {
        // 根据碰撞位置调整球的角度
        const hitPosition = (newX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
        // 确保最小角度，避免垂直碰撞
        const minAngle = Math.PI / 6; // 30度最小角度
        const angle = Math.sign(hitPosition) * Math.max(minAngle, Math.abs(hitPosition) * Math.PI / 3);
        const speed = Math.sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy);
        newVelocity = {
          dx: speed * Math.sin(angle),
          dy: -speed * Math.cos(angle)
        };
        newY = BOARD_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS;
      }

      // 砖块碰撞检测
      let bricksHit = false;
      newBricks = bricks.map(brick => {
        if (brick.status === 1) {
          // 精确的碰撞检测
          if (
            newX + BALL_RADIUS > brick.x &&
            newX - BALL_RADIUS < brick.x + BRICK_WIDTH &&
            newY + BALL_RADIUS > brick.y &&
            newY - BALL_RADIUS < brick.y + BRICK_HEIGHT
          ) {
            // 确定碰撞方向
            const overlapLeft = (brick.x + BRICK_WIDTH) - (newX - BALL_RADIUS);
            const overlapRight = (newX + BALL_RADIUS) - brick.x;
            const overlapTop = (brick.y + BRICK_HEIGHT) - (newY - BALL_RADIUS);
            const overlapBottom = (newY + BALL_RADIUS) - brick.y;
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
              newVelocity.dx = -newVelocity.dx;
            } else {
              newVelocity.dy = -newVelocity.dy;
            }
            
            newScore += 10;
            newHighScore = Math.max(highScore, newScore);
            bricksHit = true;
            return { ...brick, status: 0 };
          }
        }
        return brick;
      });

      // 检查是否所有砖块都被消除
      if (!bricksHit) {
        const remainingBricks = newBricks.filter(brick => brick.status === 1);
        if (remainingBricks.length === 0) {
          newGameWon = true;
          setIsRunning(false);
        }
      }

      // 更新状态
      if (newVelocity.dx !== velocity.dx || newVelocity.dy !== velocity.dy) {
        setVelocity(newVelocity);
      }
      
      if (JSON.stringify(newBricks) !== JSON.stringify(bricks)) {
        setBricks(newBricks);
      }
      
      if (newScore !== score) {
        setScore(newScore);
        if (newHighScore !== highScore) {
          setHighScore(newHighScore);
        }
      }
      
      if (newLives !== lives) {
        setLives(newLives);
      }
      
      if (newGameOver !== gameOver) {
        setGameOver(newGameOver);
      }
      
      if (newGameWon !== gameWon) {
        setGameWon(newGameWon);
      }

      return { x: newX, y: newY };
    });

    // 继续下一次动画帧
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, isPaused, velocity, paddleX, bricks, score, highScore, lives, gameOver, gameWon]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        setPaddleX(prev => Math.max(0, prev - 25));
        break;
      case 'ArrowRight':
        setPaddleX(prev => Math.min(BOARD_WIDTH - PADDLE_WIDTH, prev + 25));
        break;
      case ' ': // 空格键暂停/继续游戏
        setIsPaused(prev => !prev);
        break;
      case 'r': // R键重新开始
        resetGame();
        break;
      case 'Escape': // ESC键返回游戏选择
        onBack();
        break;
      default:
        break;
    }
  }, [onBack, resetGame]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    mouseXRef.current = mouseX;
    const newPaddleX = Math.max(0, Math.min(BOARD_WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
    setPaddleX(newPaddleX);
  }, []);

  // 游戏循环效果
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // 键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 初始化游戏
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // 渲染游戏
  const renderGame = () => {
    return (
      <div
        className="breakout-board"
        style={{
          width: `${BOARD_WIDTH}px`,
          height: `${BOARD_HEIGHT}px`,
          position: 'relative',
          backgroundColor: 'rgba(20, 20, 30, 0.9)',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(106, 90, 205, 0.6)',
          overflow: 'hidden',
          border: '2px solid #6a5acd'
        }}
        onMouseMove={handleMouseMove}
      >
        {/* 背景渐变 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(106, 90, 205, 0.1) 0%, rgba(75, 0, 130, 0.1) 100%)',
          zIndex: 0
        }} />

        {/* 砖块 */}
        {bricks.map((brick) => (
          brick.status === 1 && (
            <div
              key={brick.id}
              className="brick"
              style={{
                position: 'absolute',
                left: `${brick.x}px`,
                top: `${brick.y}px`,
                width: `${BRICK_WIDTH}px`,
                height: `${BRICK_HEIGHT}px`,
                backgroundColor: brick.color,
                borderRadius: '6px',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease',
                zIndex: 1
              }}
            />
          )
        ))}

        {/* 球 */}
        <div
          className="ball"
          style={{
            position: 'absolute',
            left: `${ball.x - BALL_RADIUS}px`,
            top: `${ball.y - BALL_RADIUS}px`,
            width: `${BALL_RADIUS * 2}px`,
            height: `${BALL_RADIUS * 2}px`,
            backgroundColor: '#00ffcc',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(0, 255, 204, 0.9)',
            zIndex: 3
          }}
        />

        {/* Paddle */}
        <div
          className="paddle"
          style={{
            position: 'absolute',
            left: `${paddleX}px`,
            top: `${BOARD_HEIGHT - PADDLE_HEIGHT}px`,
            width: `${PADDLE_WIDTH}px`,
            height: `${PADDLE_HEIGHT}px`,
            backgroundColor: '#6a5acd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(106, 90, 205, 0.8)',
            zIndex: 2
          }}
        />

        {/* 生命值 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '18px',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          zIndex: 4
        }}>
          生命: {Array(lives).fill('❤️').join('')}
        </div>

        {/* 分数 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '18px',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          zIndex: 4
        }}>
          分数: {score}
        </div>

        {/* 暂停提示 */}
        {isPaused && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48px',
            color: '#ffffff',
            fontWeight: 'bold',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.8)',
            zIndex: 10
          }}>
            暂停
          </div>
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
            打砖块
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
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>生命</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{lives}</span>
          </div>
        </div>
      </div>

      {renderGame()}

      <div className="control-buttons" style={{
        marginTop: '30px',
        display: 'flex',
        gap: '20px'
      }}>
        <button 
          className="control-btn"
          onClick={() => setPaddleX(prev => Math.max(0, prev - 20))}
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
          ←
        </button>
        <button 
          className="control-btn"
          onClick={() => setIsPaused(prev => !prev)}
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
          {isPaused ? '▶' : '⏸'}
        </button>
        <button 
          className="control-btn"
          onClick={resetGame}
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
          🔄
        </button>
        <button 
          className="control-btn"
          onClick={() => setPaddleX(prev => Math.min(BOARD_WIDTH - PADDLE_WIDTH, prev + 20))}
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
          →
        </button>
      </div>

      {(gameOver || gameWon) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(106, 90, 205, 0.8)',
            border: '2px solid #6a5acd',
            textAlign: 'center'
          }}>
            <h2 style={{
              color: gameWon ? '#00ffcc' : '#ff6b6b',
              fontSize: '36px',
              marginBottom: '20px'
            }}>
              {gameWon ? '恭喜获胜！' : '游戏结束'}
            </h2>
            <p style={{
              color: '#ffffff',
              fontSize: '24px',
              marginBottom: '30px'
            }}>
              最终分数: {score}
            </p>
            {gameWon && (
              <p style={{
                color: '#00ffcc',
                fontSize: '18px',
                marginBottom: '30px'
              }}>
                你成功消除了所有砖块！
              </p>
            )}
            <div style={{ display: 'flex', gap: '20px' }}>
              <button 
                onClick={resetGame}
                style={{
                  padding: '12px 24px',
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
                重新开始
              </button>
              <button 
                onClick={onBack}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#444'}
              >
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-info" style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#ffffff',
        opacity: 0.7,
        maxWidth: '600px'
      }}>
        <p>使用方向键或鼠标移动 paddle</p>
        <p>空格键暂停/继续游戏，R键重新开始，ESC键返回主菜单</p>
        <p>随着分数增加，游戏难度会逐渐提高</p>
      </div>
    </div>
  );
}

export default BreakoutGame;