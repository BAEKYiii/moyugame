import React, { useState, useCallback, useEffect, useRef } from 'react';

// 游戏配置
const GAME_DURATION = 60; // 60秒
const FRUIT_SPAWN_INTERVAL = 800; // 水果生成间隔
const FRUIT_FALL_SPEED = 5; // 水果下落速度
const FRUIT_TYPES = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍑', '🍍'];

// 水果类型
type Fruit = {
  id: number;
  type: string;
  x: number;
  y: number;
  speed: number;
  angle: number;
  size: number;
  isSliced: boolean;
};

interface FruitNinjaGameProps {
  onBack: () => void;
}

function FruitNinjaGame({ onBack }: FruitNinjaGameProps) {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isSlicing, setIsSlicing] = useState(false);
  const [slicePath, setSlicePath] = useState('');

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fruitIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>();
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 生成随机水果
  const spawnFruit = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const id = Date.now();
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const x = Math.random() * (window.innerWidth * 0.8) + (window.innerWidth * 0.1);
    const y = window.innerHeight;
    const speed = Math.random() * 3 + FRUIT_FALL_SPEED;
    const angle = (Math.random() * 90 - 45) * (Math.PI / 180); // -45到45度
    const size = Math.random() * 20 + 30;

    setFruits(prev => [...prev, { id, type, x, y, speed, angle, size, isSliced: false }]);
  }, [gameStarted, gameOver]);

  // 更新水果位置
  const updateFruits = useCallback(() => {
    if (!gameStarted || gameOver) return;

    setFruits(prev => {
      const updatedFruits = prev.map(fruit => {
        if (fruit.isSliced) {
          // 被切开的水果下落
          return {
            ...fruit,
            y: fruit.y + fruit.speed * 1.5
          };
        } else {
          // 正常水果抛物线运动
          return {
            ...fruit,
            x: fruit.x + Math.sin(fruit.angle) * fruit.speed * 0.5,
            y: fruit.y - Math.cos(fruit.angle) * fruit.speed + 0.5 * 9.8 * 0.01
          };
        }
      });

      // 移除超出屏幕的水果
      return updatedFruits.filter(fruit => fruit.y < window.innerHeight + 100);
    });

    animationFrameRef.current = requestAnimationFrame(updateFruits);
  }, [gameStarted, gameOver]);

  // 开始游戏
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameStarted(true);
    setGameOver(false);
    setFruits([]);
    setSlicePath('');

    // 清除之前的定时器
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (fruitIntervalRef.current) {
      clearInterval(fruitIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 开始计时
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = null;
          }
          if (fruitIntervalRef.current) {
            clearInterval(fruitIntervalRef.current);
            fruitIntervalRef.current = null;
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
          }
          setGameOver(true);
          setGameStarted(false);
          setHighScore(prevHigh => Math.max(prevHigh, score));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 开始生成水果
    spawnFruit();
    fruitIntervalRef.current = setInterval(spawnFruit, FRUIT_SPAWN_INTERVAL);

    // 开始更新水果位置
    animationFrameRef.current = requestAnimationFrame(updateFruits);
  }, [spawnFruit, updateFruits, score]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameStarted || gameOver) return;

    const { clientX, clientY } = e;
    
    if (isSlicing) {
      setSlicePath(prev => prev + ` L ${clientX} ${clientY}`);
      
      // 检查是否切到水果
      setFruits(prev => {
        const updatedFruits = prev.map(fruit => {
          if (fruit.isSliced) return fruit;
          
          // 计算鼠标轨迹与水果的距离
          const distance = Math.sqrt(
            Math.pow(clientX - fruit.x, 2) + Math.pow(clientY - fruit.y, 2)
          );
          
          if (distance < fruit.size / 2) {
            setScore(prev => prev + 10);
            return { ...fruit, isSliced: true };
          }
          return fruit;
        });
        return updatedFruits;
      });
    }
    
    lastMousePos.current = { x: clientX, y: clientY };
  }, [gameStarted, gameOver, isSlicing]);

  // 开始切片
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!gameStarted || gameOver) return;
    
    const { clientX, clientY } = e;
    setIsSlicing(true);
    setSlicePath(`M ${clientX} ${clientY}`);
  }, [gameStarted, gameOver]);

  // 结束切片
  const handleMouseUp = useCallback(() => {
    setIsSlicing(false);
    // 延迟清除切片路径，让玩家看到切片效果
    setTimeout(() => setSlicePath(''), 300);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
      if (fruitIntervalRef.current) {
        clearInterval(fruitIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 渲染游戏
  const renderGame = () => {
    return (
      <div
        className="fruit-ninja-game"
        style={{
          width: '100%',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* 水果 */}
        {fruits.map(fruit => (
          <div
            key={fruit.id}
            className="fruit"
            style={{
              position: 'absolute',
              left: `${fruit.x}px`,
              top: `${fruit.y}px`,
              fontSize: `${fruit.size}px`,
              transform: fruit.isSliced ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: fruit.isSliced ? 'transform 0.3s ease' : 'none',
              pointerEvents: 'none'
            }}
          >
            {fruit.type}
          </div>
        ))}

        {/* 切片轨迹 */}
        {slicePath && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            <path
              d={slicePath}
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))' }}
            />
          </svg>
        )}

        {/* 游戏信息 */}
        <div className="game-info" style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="score" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            分数: {score}
          </div>
          <div className="time" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            时间: {timeLeft}s
          </div>
          <div className="high-score" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            最高分: {highScore}
          </div>
        </div>
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
            水果忍者
          </h1>
        </div>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start" style={{
          textAlign: 'center',
          margin: '2rem 0',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10
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
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '40px',
          borderRadius: '12px',
          color: 'white'
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

      {renderGame()}

      <div className="game-info" style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#ffffff',
        opacity: 0.7,
        maxWidth: '600px',
        position: 'absolute',
        bottom: '20px',
        zIndex: 5
      }}>
        <h3>游戏规则：</h3>
        <p>1. 用鼠标划过水果来切开它们</p>
        <p>2. 游戏时间为60秒</p>
        <p>3. 切开一个水果得10分</p>
        <p>4. 尽可能在时间结束前获得最高分</p>
      </div>
    </div>
  );
}

export default FruitNinjaGame;