import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;

// 方向类型
type Direction = { x: number; y: number };
// 蛇身部分类型
type SnakePart = { x: number; y: number };
// 食物类型
type Food = { x: number; y: number };

interface SnakeGameProps {
  onBack: () => void;
}

function SnakeGame({ onBack }: SnakeGameProps) {
  // 游戏状态
  const [snake, setSnake] = useState<SnakePart[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Food>(generateFood());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED);

  // 游戏循环引用
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 生成随机食物位置
  function generateFood(): Food {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  // 检查位置是否在蛇身上
  function isOnSnake(position: Food): boolean {
    return snake.some(part => part.x === position.x && part.y === position.y);
  }

  // 生成新食物
  function generateValidFood() {
    let newFood: Food;
    do {
      newFood = generateFood();
    } while (isOnSnake(newFood));
    setFood(newFood);
  }

  // 处理方向改变
  const handleDirectionChange = useCallback((newDirection: Direction) => {
    // 防止直接反向移动
    if (
      (newDirection.x === -direction.x && newDirection.y === -direction.y) ||
      (newDirection.x !== 0 && newDirection.y !== 0) // 确保只在一个方向移动
    ) {
      return;
    }
    setDirection(newDirection);
  }, [direction]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        handleDirectionChange({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        handleDirectionChange({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        handleDirectionChange({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        handleDirectionChange({ x: 1, y: 0 });
        break;
      case ' ': // 空格键开始/暂停
        toggleGame();
        break;
      case 'r': // R键重新开始
        if (gameOver) {
          restartGame();
        }
        break;
      case 'Escape': // ESC键返回游戏选择
        onBack();
        break;
      default:
        break;
    }
  }, [handleDirectionChange, gameOver, onBack]);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      // 移动头部
      head.x += direction.x;
      head.y += direction.y;

      // 边界检查 - 蛇可以穿过边界
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      // 碰撞检查
      if (prevSnake.some(part => part.x === head.x && part.y === head.y)) {
        setGameOver(true);
        setIsRunning(false);
        return prevSnake;
      }

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        // 增加分数
        setScore(prevScore => {
          const newScore = prevScore + 10;
          setHighScore(prevHighScore => Math.max(prevHighScore, newScore));
          return newScore;
        });
        // 生成新食物
        generateValidFood();
        // 增加游戏速度
        setGameSpeed(prevSpeed => Math.max(80, prevSpeed - 5));
        // 蛇身增长
        newSnake.unshift(head);
      } else {
        // 移动蛇身
        newSnake.pop();
        newSnake.unshift(head);
      }

      return newSnake;
    });
  }, [direction, food]);

  // 切换游戏状态
  function toggleGame() {
    if (gameOver) {
      restartGame();
    } else {
      setIsRunning(prev => !prev);
    }
  }

  // 重新开始游戏
  function restartGame() {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    generateValidFood();
    setScore(0);
    setGameOver(false);
    setIsRunning(true);
    setGameSpeed(GAME_SPEED);
  }

  // 游戏循环效果
  useEffect(() => {
    if (isRunning) {
      gameLoopRef.current = setInterval(gameLoop, gameSpeed);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isRunning, gameLoop, gameSpeed]);

  // 键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 渲染游戏网格
  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = x === snake[0].x && y === snake[0].y;
        const isSnakeBody = snake.some((part, index) => index > 0 && part.x === x && part.y === y);
        const isFood = x === food.x && y === food.y;

        let cellClass = 'snake-cell';
        if (isSnakeHead || isSnakeBody) cellClass += ' snake';
        else if (isFood) cellClass += ' food';

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
            }}
          />
        );
      }
    }

    return (
      <div
        className="snake-grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
        }}
      >
        {cells}
      </div>
    );
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-container">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <h1 className="game-title">贪吃蛇</h1>
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
          <div className="stat-item">
            <span>长度</span>
            <span className="stat-value">{snake.length}</span>
          </div>
        </div>
      </div>

      {renderGrid()}

      <div className="control-buttons">
        <button className="control-btn" onClick={() => handleDirectionChange({ x: 0, y: -1 })}>↑</button>
        <button className="control-btn" onClick={() => handleDirectionChange({ x: -1, y: 0 })}>←</button>
        <button className="control-btn" onClick={toggleGame}>{isRunning ? '⏸' : '▶'}</button>
        <button className="control-btn" onClick={() => handleDirectionChange({ x: 1, y: 0 })}>→</button>
        <button className="control-btn" onClick={() => handleDirectionChange({ x: 0, y: 1 })}>↓</button>
      </div>

      {gameOver && (
        <div className="game-over">
          <h2>游戏结束</h2>
          <p>最终分数: {score}</p>
          <p>蛇的长度: {snake.length}</p>
          <div>
            <button className="btn btn-primary" onClick={restartGame}>重新开始</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}

      <div className="game-info" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
        <p>使用方向键或屏幕按钮控制蛇的移动</p>
        <p>空格键开始/暂停游戏，R键重新开始，ESC键返回主菜单</p>
      </div>
    </div>
  );
}

export default SnakeGame;