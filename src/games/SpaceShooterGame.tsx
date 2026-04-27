import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_RATE = 0.03;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;

// 子弹类型
type Bullet = {
  id: number;
  x: number;
  y: number;
};

// 敌人类型
type Enemy = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'basic' | 'fast' | 'boss';
};

interface SpaceShooterGameProps {
  onBack: () => void;
}

function SpaceShooterGame({ onBack }: SpaceShooterGameProps) {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  
  const bulletIdCounter = useRef(0);
  const enemyIdCounter = useRef(0);

  // 发射子弹
  const shoot = useCallback(() => {
    if (!isRunning || isGameOver) return;
    
    const bulletId = bulletIdCounter.current++;
    setBullets(prev => [...prev, {
      id: bulletId,
      x: playerX,
      y: GAME_HEIGHT - 60
    }]);
  }, [playerX, isRunning, isGameOver]);

  // 生成敌人
  const spawnEnemy = useCallback(() => {
    const id = enemyIdCounter.current++;
    const enemyType = Math.random() > 0.8 ? 'boss' : (Math.random() > 0.5 ? 'fast' : 'basic');
    
    setEnemies(prev => [...prev, {
      id,
      x: Math.random() * (GAME_WIDTH - 50),
      y: -50,
      size: enemyType === 'boss' ? 60 : (enemyType === 'fast' ? 30 : 40),
      type: enemyType
    }]);
  }, []);

  // 游戏主循环
  useEffect(() => {
    if (!isRunning || isGameOver) return;

    const gameLoop = setInterval(() => {
      // 生成敌人
      if (Math.random() < ENEMY_SPAWN_RATE) {
        spawnEnemy();
      }

      // 更新敌人位置
      setEnemies(prev => {
        return prev
          .map(enemy => ({
            ...enemy,
            y: enemy.y + (enemy.type === 'fast' ? ENEMY_SPEED * 1.5 : ENEMY_SPEED)
          }))
          .filter(enemy => enemy.y < GAME_HEIGHT + 50);
      });

      // 更新子弹位置
      setBullets(prev => {
        return prev
          .map(bullet => ({
            ...bullet,
            y: bullet.y - BULLET_SPEED
          }))
          .filter(bullet => bullet.y > -10);
      });

      // 检测子弹与敌人碰撞
      setBullets(prevBullets => {
        let updatedBullets = [...prevBullets];
        let updatedEnemies = [...enemies];
        let scoreIncrease = 0;

        for (let i = updatedBullets.length - 1; i >= 0; i--) {
          const bullet = updatedBullets[i];
          const bulletRight = bullet.x + 5;
          const bulletLeft = bullet.x - 5;
          const bulletTop = bullet.y + 10;
          const bulletBottom = bullet.y - 10;

          for (let j = updatedEnemies.length - 1; j >= 0; j--) {
            const enemy = updatedEnemies[j];
            const enemyRight = enemy.x + enemy.size / 2;
            const enemyLeft = enemy.x - enemy.size / 2;
            const enemyTop = enemy.y + enemy.size / 2;
            const enemyBottom = enemy.y - enemy.size / 2;

            if (
              bulletRight > enemyLeft &&
              bulletLeft < enemyRight &&
              bulletTop > enemyBottom &&
              bulletBottom < enemyTop
            ) {
              // 击中敌人
              updatedBullets.splice(i, 1);
              updatedEnemies.splice(j, 1);
              const points = enemy.type === 'boss' ? 50 : (enemy.type === 'fast' ? 20 : 10);
              scoreIncrease += points;
              break;
            }
          }
        }

        if (scoreIncrease > 0) {
          setEnemies(updatedEnemies);
          setScore(prev => {
            const newScore = prev + scoreIncrease;
            setHighScore(prevHigh => Math.max(prevHigh, newScore));
            return newScore;
          });
        }

        return updatedBullets;
      });

      // 检测敌人与玩家碰撞
      setEnemies(prevEnemies => {
        const playerRight = playerX + 30;
        const playerLeft = playerX - 30;
        const playerTop = GAME_HEIGHT - 30;
        const playerBottom = GAME_HEIGHT - 60;

        for (const enemy of prevEnemies) {
          const enemyRight = enemy.x + enemy.size / 2;
          const enemyLeft = enemy.x - enemy.size / 2;
          const enemyTop = enemy.y + enemy.size / 2;
          const enemyBottom = enemy.y - enemy.size / 2;

          if (
            playerRight > enemyLeft &&
            playerLeft < enemyRight &&
            playerTop > enemyBottom &&
            playerBottom < enemyTop
          ) {
            setIsGameOver(true);
            setIsRunning(false);
            break;
          }
        }
        return prevEnemies;
      });

    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [isRunning, isGameOver, playerX, spawnEnemy]);

  // 键盘事件监听 - 使用useRef跟踪按键状态，实现更流畅的移动
  const keysPressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ') {
        shoot();
      } else if (e.key === 'r' && isGameOver) {
        initGame();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 游戏循环中的移动更新
    const moveInterval = setInterval(() => {
      if (isRunning && !isGameOver) {
        setPlayerX(prev => {
          let newX = prev;
          if (keysPressed.current['ArrowLeft']) {
            newX = Math.max(30, newX - PLAYER_SPEED);
          }
          if (keysPressed.current['ArrowRight']) {
            newX = Math.min(GAME_WIDTH - 30, newX + PLAYER_SPEED);
          }
          return newX;
        });
      }
    }, 16); // 约60fps

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveInterval);
    };
  }, [isRunning, isGameOver, shoot, onBack]);

  // 初始化游戏
  const initGame = useCallback(() => {
    setPlayerX(GAME_WIDTH / 2);
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
  }, []);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-container">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <h1 className="game-title">飞机射击</h1>
        </div>
        <div className="game-stats">
          <div className="stat-item">
            <span>分数</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span>最高分</span>
            <span className="stat-value">{highScore}</span>
          </div>
        </div>
      </div>

      <div 
        className="space-shooter-container"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(106, 90, 205, 0.5)',
          margin: '2rem auto'
        }}
      >
        {/* 星空背景 */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 100%)'
        }}>
          {/* 星星 */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                backgroundColor: 'white',
                borderRadius: '50%',
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>

        {/* 玩家飞机 */}
        <div
          style={{
            position: 'absolute',
            left: `${playerX - 30}px`,
            bottom: '30px',
            width: '60px',
            height: '60px',
            transition: 'left 0.1s ease'
          }}
        >
          {/* 飞机机翼 */}
          <div style={{
            position: 'absolute',
            top: '25px',
            left: '0',
            width: '100%',
            height: '10px',
            backgroundColor: '#00bfff',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)'
          }} />
          {/* 飞机主体 */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '20px',
            width: '20px',
            height: '30px',
            backgroundColor: '#00bfff',
            borderRadius: '5px 5px 0 0',
            boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)'
          }} />
          {/* 飞机头部 */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '25px',
            width: '10px',
            height: '10px',
            backgroundColor: '#00bfff',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(0, 191, 255, 0.8)'
          }} />
          {/* 驾驶舱 */}
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '23px',
            width: '14px',
            height: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '5px',
            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.3)'
          }} />
          {/* 尾部喷射 */}
          <div style={{
            position: 'absolute',
            top: '45px',
            left: '25px',
            width: '10px',
            height: '15px',
            backgroundColor: '#ff6600',
            borderRadius: '0 0 5px 5px',
            boxShadow: '0 5px 10px rgba(255, 102, 0, 0.8)'
          }} />
        </div>

        {/* 子弹 */}
        {bullets.map(bullet => (
          <div
            key={bullet.id}
            style={{
              position: 'absolute',
              left: `${bullet.x - 5}px`,
              top: `${bullet.y - 10}px`,
              width: '10px',
              height: '20px',
              backgroundColor: '#ffff00',
              borderRadius: '5px',
              boxShadow: '0 0 10px rgba(255, 255, 0, 0.8)'
            }}
          />
        ))}

        {/* 敌人 */}
        {enemies.map(enemy => (
          <div
            key={enemy.id}
            style={{
              position: 'absolute',
              left: `${enemy.x - enemy.size / 2}px`,
              top: `${enemy.y - enemy.size / 2}px`,
              width: `${enemy.size}px`,
              height: `${enemy.size}px`,
              backgroundColor: enemy.type === 'boss' ? '#ff0066' : (enemy.type === 'fast' ? '#ff6600' : '#ff3333'),
              borderRadius: enemy.type === 'boss' ? '50%' : '10px',
              boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)',
              transition: 'top 0.1s linear'
            }}
          >
            {/* 敌人眼睛 */}
            {enemy.type !== 'boss' && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '30%',
                  left: '25%',
                  width: '20%',
                  height: '20%',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '30%',
                  right: '25%',
                  width: '20%',
                  height: '20%',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} />
              </>
            )}
            {/* Boss敌人 */}
            {enemy.type === 'boss' && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  left: '20%',
                  width: '25%',
                  height: '25%',
                  backgroundColor: 'red',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  right: '20%',
                  width: '25%',
                  height: '25%',
                  backgroundColor: 'red',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '55%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30%',
                  height: '20%',
                  backgroundColor: 'darkred',
                  borderRadius: '5px'
                }} />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="control-buttons">
        <button className="control-btn" onClick={() => setIsRunning(prev => !prev)}>
          {isRunning ? '⏸' : '▶'}
        </button>
        <button className="control-btn" onClick={initGame}>🔄</button>
        <button className="control-btn" onClick={shoot}>🔫</button>
      </div>

      {isGameOver && (
        <div className="game-over">
          <h2>游戏结束</h2>
          <p>最终分数: {score}</p>
          <div>
            <button className="btn btn-primary" onClick={initGame}>重新开始</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}

      <div className="game-info" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
        <p>使用方向键移动飞机，空格键发射子弹</p>
        <p>击落敌人获得分数，避免被敌人撞到</p>
        <p>R键重新开始，ESC键返回主菜单</p>
      </div>
    </div>
  );
}

export default SpaceShooterGame;