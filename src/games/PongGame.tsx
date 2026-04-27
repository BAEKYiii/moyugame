import React, { useState, useCallback, useEffect, useRef } from 'react';

// 游戏配置
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 8;
const BALL_SPEED = 5;

interface PongGameProps {
  onBack: () => void;
}

function PongGame({ onBack }: PongGameProps) {
  const [paddle1Y, setPaddle1Y] = useState((GAME_HEIGHT - PADDLE_HEIGHT) / 2);
  const [paddle2Y, setPaddle2Y] = useState((GAME_HEIGHT - PADDLE_HEIGHT) / 2);
  const [ballX, setBallX] = useState(GAME_WIDTH / 2);
  const [ballY, setBallY] = useState(GAME_HEIGHT / 2);
  const [ballDX, setBallDX] = useState(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
  const [ballDY, setBallDY] = useState(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // 初始化游戏
  const initGame = useCallback(() => {
    setPaddle1Y((GAME_HEIGHT - PADDLE_HEIGHT) / 2);
    setPaddle2Y((GAME_HEIGHT - PADDLE_HEIGHT) / 2);
    setBallX(GAME_WIDTH / 2);
    setBallY(GAME_HEIGHT / 2);
    setBallDX(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
    setBallDY(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
    setScore1(0);
    setScore2(0);
    setGameStarted(false);
    setGameOver(false);
    setWinner(null);
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
  }, []);

  // 更新游戏状态
  const updateGame = useCallback(() => {
    if (!gameStarted || gameOver) return;

    // 更新 paddle 1 位置 (玩家)
    if (keysRef.current['ArrowUp'] && paddle1Y > 0) {
      setPaddle1Y(prev => Math.max(0, prev - PADDLE_SPEED));
    }
    if (keysRef.current['ArrowDown'] && paddle1Y < GAME_HEIGHT - PADDLE_HEIGHT) {
      setPaddle1Y(prev => Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + PADDLE_SPEED));
    }

    // 更新 paddle 2 位置 (AI)
    const aiTarget = ballY - (PADDLE_HEIGHT / 2);
    setPaddle2Y(prev => {
      if (Math.abs(aiTarget - prev) > 5) {
        return prev + (aiTarget > prev ? PADDLE_SPEED * 0.8 : -PADDLE_SPEED * 0.8);
      }
      return prev;
    });

    // 更新球的位置
    setBallX(prevX => {
      const newX = prevX + ballDX;
      
      // 检查是否与 paddle 1 碰撞
      if (newX <= PADDLE_WIDTH + BALL_SIZE && 
          ballY >= paddle1Y && 
          ballY <= paddle1Y + PADDLE_HEIGHT) {
        setBallDX(Math.abs(ballDX) * 1.05); // 增加球速
        return PADDLE_WIDTH + BALL_SIZE;
      }
      
      // 检查是否与 paddle 2 碰撞
      if (newX >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE && 
          ballY >= paddle2Y && 
          ballY <= paddle2Y + PADDLE_HEIGHT) {
        setBallDX(-Math.abs(ballDX) * 1.05); // 增加球速
        return GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE;
      }
      
      // 检查是否得分
      if (newX <= 0) {
        setScore2(prev => prev + 1);
        if (score2 + 1 >= 5) {
          setGameOver(true);
          setWinner('AI');
          setHighScore(prev => Math.max(prev, score1));
        } else {
          setBallX(GAME_WIDTH / 2);
          setBallY(GAME_HEIGHT / 2);
          setBallDX(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
          setBallDY(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
        }
        return GAME_WIDTH / 2;
      }
      
      if (newX >= GAME_WIDTH) {
        setScore1(prev => prev + 1);
        if (score1 + 1 >= 5) {
          setGameOver(true);
          setWinner('玩家');
          setHighScore(prev => Math.max(prev, score1 + 1));
        } else {
          setBallX(GAME_WIDTH / 2);
          setBallY(GAME_HEIGHT / 2);
          setBallDX(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
          setBallDY(BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
        }
        return GAME_WIDTH / 2;
      }
      
      return newX;
    });

    setBallY(prevY => {
      const newY = prevY + ballDY;
      
      // 检查是否与上下边界碰撞
      if (newY <= 0 || newY >= GAME_HEIGHT - BALL_SIZE) {
        setBallDY(-ballDY);
        return Math.max(0, Math.min(GAME_HEIGHT - BALL_SIZE, newY));
      }
      
      return newY;
    });

    animationFrameRef.current = requestAnimationFrame(updateGame);
  }, [gameStarted, gameOver, paddle1Y, paddle2Y, ballDX, ballDY, score1, score2]);

  // 渲染游戏
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 绘制背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 绘制中线
    ctx.strokeStyle = '#555';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制 paddle 1
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // 绘制 paddle 2
    ctx.fillStyle = '#fff';
    ctx.fillRect(GAME_WIDTH - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // 绘制球
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${score1}`, GAME_WIDTH / 4, 50);
    ctx.fillText(`${score2}`, GAME_WIDTH * 3 / 4, 50);
  }, [paddle1Y, paddle2Y, ballX, ballY, score1, score2]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  }, []);

  // 游戏循环
  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gameOver, updateGame]);

  // 渲染游戏画面
  useEffect(() => {
    renderGame();
  }, [renderGame]);

  // 键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
            乒乓游戏
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>最高分</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{highScore}</span>
          </div>
        </div>
      </div>

      <div className="game-canvas" style={{
        position: 'relative',
        margin: '2rem auto'
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            border: '2px solid #555',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
          }}
        />

        {!gameStarted && !gameOver && (
          <div className="game-start" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '40px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>乒乓游戏</h2>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>使用方向键控制左侧 paddle</p>
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
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '40px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>游戏结束！</h2>
            <p style={{ fontSize: '24px', marginBottom: '20px' }}>{winner} 获胜！</p>
            <p style={{ fontSize: '20px', marginBottom: '30px' }}>最终比分: {score1} - {score2}</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
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
                再玩一次
              </button>
              <button 
                className="reset-btn"
                onClick={initGame}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#444'}
              >
                重置游戏
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="game-info" style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#ffffff',
        opacity: 0.7,
        maxWidth: '600px'
      }}>
        <h3>游戏规则：</h3>
        <p>1. 使用方向键 ↑ ↓ 控制左侧 paddle</p>
        <p>2. 先获得5分的一方获胜</p>
        <p>3. 球碰到 paddle 会反弹并加速</p>
        <p>4. 球超出边界则对方得分</p>
      </div>
    </div>
  );
}

export default PongGame;