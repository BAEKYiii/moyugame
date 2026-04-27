import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_SPEED = 10;
const GRAVITY = 0.3;
const JUMP_FORCE = -6;
const PIPE_WIDTH = 80;
const PIPE_GAP = 180;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 2500; // 毫秒

// 管道类型
type Pipe = {
  id: number;
  x: number;
  topHeight: number;
  bottomY: number;
};

interface FlappyBirdGameProps {
  onBack: () => void;
}

// 小鸟组件
function BirdModel({ position, rotation }: { position: { x: number; y: number }; rotation: number }) {
  return (
    <div 
      className="bird"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '40px',
        height: '30px',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.1s ease',
        zIndex: 10
      }}
    >
      {/* 使用emoji作为小鸟 */}
      <div style={{
        fontSize: '30px',
        lineHeight: '1',
        transform: 'scaleX(-1)', // 翻转emoji使其面向右侧
        animation: 'flap 0.5s infinite alternate'
      }}>
        🐦
      </div>
    </div>
  );
}

// 主游戏组件
function FlappyBirdGame({ onBack }: FlappyBirdGameProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [birdPosition, setBirdPosition] = useState({ x: 150, y: 200 });
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [birdRotation, setBirdRotation] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [gameAreaHeight, setGameAreaHeight] = useState(500);
  const [gameAreaWidth, setGameAreaWidth] = useState(800);
  
  const pipeIdCounter = useRef(0);
  const lastPipeSpawnTime = useRef(Date.now());
  const animationFrameRef = useRef<number>();

  // 处理跳跃
  const handleJump = useCallback(() => {
    if (!isRunning || isGameOver) return;
    setBirdVelocity(JUMP_FORCE);
  }, [isRunning, isGameOver]);

  // 生成管道
  const spawnPipe = useCallback(() => {
    const id = pipeIdCounter.current++;
    const topHeight = Math.random() * (gameAreaHeight - PIPE_GAP - 100) + 50;
    const bottomY = topHeight + PIPE_GAP;
    setPipes(prev => [...prev, {
      id,
      x: gameAreaWidth,
      topHeight,
      bottomY
    }]);
  }, [gameAreaHeight, gameAreaWidth]);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!isRunning || isGameOver) {
      // 游戏未开始或游戏结束时，保持小鸟在初始位置
      if (!isRunning && !isGameOver) {
        setBirdPosition({ x: 150, y: 200 });
        setBirdVelocity(0);
        setBirdRotation(0);
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // 检查是否生成新管道
    const currentTime = Date.now();
    if (currentTime - lastPipeSpawnTime.current > PIPE_SPAWN_RATE) {
      spawnPipe();
      lastPipeSpawnTime.current = currentTime;
    }

    // 更新管道位置
    setPipes(prev => {
      return prev
        .map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED
        }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);
    });

    // 检测碰撞
    const birdRight = birdPosition.x + 40;
    const birdLeft = birdPosition.x;
    const birdTop = birdPosition.y;
    const birdBottom = birdPosition.y + 30;

    // 检测与管道碰撞
    let collision = false;
    pipes.forEach(pipe => {
      const pipeRight = pipe.x + PIPE_WIDTH;
      const pipeLeft = pipe.x;
      
      if (
        birdRight > pipeLeft &&
        birdLeft < pipeRight &&
        (birdTop < pipe.topHeight || birdBottom > pipe.bottomY)
      ) {
        collision = true;
      }
    });

    // 检测与边界碰撞
    if (birdTop < 0 || birdBottom > gameAreaHeight) {
      collision = true;
    }

    if (collision) {
      setIsGameOver(true);
      setIsRunning(false);
    }

    // 更新小鸟位置和速度
    setBirdPosition(prev => {
      const newY = prev.y + birdVelocity;
      return { ...prev, y: newY };
    });

    setBirdVelocity(prev => prev + GRAVITY);

    // 更新小鸟旋转
    setBirdRotation(prev => {
      if (birdVelocity < 0) {
        return Math.max(-30, prev - 5);
      } else {
        return Math.min(90, prev + 5);
      }
    });

    // 更新分数
    setScore(prev => {
      const newScore = prev + 1;
      setHighScore(prevHigh => Math.max(prevHigh, newScore));
      return newScore;
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, isGameOver, birdPosition, birdVelocity, pipes, spawnPipe, gameAreaHeight]);

  // 开始游戏（准备状态）
  const startGame = useCallback(() => {
    setIsRunning(false); // 初始为准备状态，需要用户点击空格才开始
    setIsGameOver(false);
    setScore(0);
    setBirdPosition({ x: 150, y: 200 });
    setBirdVelocity(0);
    setBirdRotation(0);
    setPipes([]);
    lastPipeSpawnTime.current = Date.now();
  }, []);

  // 真正开始游戏
  const startPlaying = useCallback(() => {
    setIsRunning(true);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Spacebar') {
        if (!isRunning && !isGameOver) {
          startPlaying(); // 开始游戏
        } else {
          handleJump(); // 跳跃
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isGameOver, handleJump, startPlaying]);

  return (
    <div className="game-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      // background: 'linear-gradient(135deg, #87ceeb 0%, #e0f7fa 100%)'
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
            像素鸟
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
        </div>
      </div>

      <div 
        className="flappy-bird-container"
        style={{
          width: '800px',
          height: '500px',
          position: 'relative',
          backgroundColor: 'rgba(135, 206, 235, 0.8)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(106, 90, 205, 0.5)',
          margin: '2rem 0'
        }}
        ref={(el) => {
          if (el) {
            setGameAreaHeight(el.clientHeight);
            setGameAreaWidth(el.clientWidth);
          }
        }}
      >
        {/* 背景 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")',
          backgroundSize: '100px 100px'
        }} />

        {/* 地面 */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '50px',
          backgroundColor: '#8b4513',
          borderTop: '2px solid #654321'
        }} />

        {/* 小鸟 */}
        <BirdModel position={birdPosition} rotation={birdRotation} />

        {/* 管道 */}
        {pipes.map(pipe => (
          <React.Fragment key={pipe.id}>
            {/* 上管道 */}
            <div
              style={{
                position: 'absolute',
                left: `${pipe.x}px`,
                top: '0',
                width: `${PIPE_WIDTH}px`,
                height: `${pipe.topHeight}px`,
                backgroundColor: '#228b22',
                borderBottomRightRadius: '20px',
                borderBottomLeftRadius: '20px',
                border: '2px solid #006400'
              }}
            />
            {/* 下管道 */}
            <div
              style={{
                position: 'absolute',
                left: `${pipe.x}px`,
                top: `${pipe.bottomY}px`,
                width: `${PIPE_WIDTH}px`,
                height: `${gameAreaHeight - pipe.bottomY}px`,
                backgroundColor: '#228b22',
                borderTopRightRadius: '20px',
                borderTopLeftRadius: '20px',
                border: '2px solid #006400'
              }}
            />
          </React.Fragment>
        ))}

        {/* 开始提示 */}
        {!isRunning && !isGameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>像素鸟</h2>
            <p style={{ fontSize: '20px', marginBottom: '30px' }}>按空格键或向上箭头键开始游戏</p>
            <p style={{ fontSize: '16px' }}>点击或按空格键控制小鸟飞行，躲避管道</p>
          </div>
        )}
      </div>

      <div className="control-buttons" style={{
        marginTop: '30px',
        display: 'flex',
        gap: '20px'
      }}>
        <button 
          className="control-btn"
          onClick={() => setIsRunning(prev => !prev)}
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
          {isRunning ? '⏸' : '▶'}
        </button>
        <button 
          className="control-btn"
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
          🔄
        </button>
        <button 
          className="control-btn"
          onClick={() => {
            if (!isRunning && !isGameOver) {
              startPlaying();
            } else {
              handleJump();
            }
          }}
          disabled={isGameOver}
          style={{
            padding: '12px 24px',
            backgroundColor: isGameOver ? '#444' : '#6a5acd',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isGameOver ? 'default' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isGameOver) {
              e.currentTarget.style.backgroundColor = '#5a4ac0';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGameOver) {
              e.currentTarget.style.backgroundColor = '#6a5acd';
            }
          }}
        >
          ↑
        </button>
      </div>

      {/* 游戏结束提示 */}
      {isGameOver && (
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
              color: '#ff6b6b',
              fontSize: '36px',
              marginBottom: '20px'
            }}>
              游戏结束
            </h2>
            <p style={{
              color: '#ffffff',
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              最终分数: {score}
            </p>
            <p style={{
              color: '#ffffff',
              fontSize: '18px',
              marginBottom: '30px'
            }}>
              最高分: {highScore}
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button 
                onClick={startGame}
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
        <h3>游戏规则：</h3>
        <p>1. 按空格键或向上箭头键控制小鸟飞行</p>
        <p>2. 躲避管道，尽可能飞得更远</p>
        <p>3. 每次成功穿过管道间隙得1分</p>
        <p>4. 碰到管道或边界游戏结束</p>
      </div>
    </div>
  );
}

export default FlappyBirdGame;