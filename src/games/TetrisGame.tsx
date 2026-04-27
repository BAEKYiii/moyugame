import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 1000;

// 方块类型
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// 方块形状
const TETROMINOS: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// 方块颜色
const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00FFFF', // 青色
  J: '#0000FF', // 蓝色
  L: '#FFA500', // 橙色
  O: '#FFFF00', // 黄色
  S: '#00FF00', // 绿色
  T: '#800080', // 紫色
  Z: '#FF0000'  // 红色
};

// 位置类型
type Position = { x: number; y: number };

// 方块类型
type Tetromino = {
  type: TetrominoType;
  shape: number[][];
  position: Position;
};

// 游戏板类型
type Board = (TetrominoType | null)[][];

interface TetrisGameProps {
  onBack: () => void;
}

function TetrisGame({ onBack }: TetrisGameProps) {
  // 游戏状态
  const [board, setBoard] = useState<Board>(() => {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  });
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED);

  // 游戏循环引用
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 生成随机方块
  function generateTetromino(): Tetromino {
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return {
      type: randomType,
      shape: TETROMINOS[randomType],
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
    };
  }

  // 检查方块是否可以移动
  function canMove(tetromino: Tetromino, offsetX: number, offsetY: number): boolean {
    const { shape, position } = tetromino;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x + offsetX;
          const newY = position.y + y + offsetY;
          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX] !== null)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // 旋转方块
  function rotateTetromino(tetromino: Tetromino): Tetromino {
    const { shape } = tetromino;
    const rotatedShape = shape[0].map((_, index) => shape.map(row => row[index])).reverse();
    return {
      ...tetromino,
      shape: rotatedShape
    };
  }

  // 将方块固定到游戏板上
  function lockTetromino(tetromino: Tetromino) {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const { shape, position, type } = tetromino;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0) {
              newBoard[boardY][boardX] = type;
            }
          }
        }
      }
      return newBoard;
    });
  }

  // 消除完整的行
  function clearLines() {
    setBoard(prevBoard => {
      const newBoard = prevBoard.filter(row => !row.every(cell => cell !== null));
      const linesCleared = prevBoard.length - newBoard.length;
      if (linesCleared > 0) {
        // 计算分数
        const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4行的分数
        setScore(prevScore => {
          const newScore = prevScore + linePoints[linesCleared];
          setHighScore(prevHighScore => Math.max(prevHighScore, newScore));
          return newScore;
        });
        // 增加游戏速度
        setGameSpeed(prevSpeed => Math.max(200, prevSpeed - 50));
        // 在顶部添加新行
        const emptyLines = Array(linesCleared).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
        return [...emptyLines, ...newBoard];
      }
      return prevBoard;
    });
  }

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!currentTetromino) return;

    if (canMove(currentTetromino, 0, 1)) {
      // 向下移动方块
      setCurrentTetromino(prev => {
        if (!prev) return null;
        return {
          ...prev,
          position: { ...prev.position, y: prev.position.y + 1 }
        };
      });
    } else {
      // 固定方块并生成新方块
      lockTetromino(currentTetromino);
      clearLines();
      const newTetromino = generateTetromino();
      if (!canMove(newTetromino, 0, 0)) {
        // 游戏结束
        setGameOver(true);
        setIsRunning(false);
      } else {
        setCurrentTetromino(newTetromino);
      }
    }
  }, [currentTetromino, board]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentTetromino || !isRunning) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (canMove(currentTetromino, -1, 0)) {
          setCurrentTetromino(prev => {
            if (!prev) return null;
            return {
              ...prev,
              position: { ...prev.position, x: prev.position.x - 1 }
            };
          });
        }
        break;
      case 'ArrowRight':
        if (canMove(currentTetromino, 1, 0)) {
          setCurrentTetromino(prev => {
            if (!prev) return null;
            return {
              ...prev,
              position: { ...prev.position, x: prev.position.x + 1 }
            };
          });
        }
        break;
      case 'ArrowDown':
        if (canMove(currentTetromino, 0, 1)) {
          setCurrentTetromino(prev => {
            if (!prev) return null;
            return {
              ...prev,
              position: { ...prev.position, y: prev.position.y + 1 }
            };
          });
        }
        break;
      case 'ArrowUp':
        const rotated = rotateTetromino(currentTetromino);
        if (canMove(rotated, 0, 0)) {
          setCurrentTetromino(rotated);
        }
        break;
      case ' ': // 空格键快速下落
        let newY = currentTetromino.position.y;
        while (canMove({ ...currentTetromino, position: { ...currentTetromino.position, y: newY + 1 } }, 0, 0)) {
          newY++;
        }
        setCurrentTetromino(prev => {
          if (!prev) return null;
          return {
            ...prev,
            position: { ...prev.position, y: newY }
          };
        });
        break;
      case 'Escape': // ESC键返回游戏选择
        onBack();
        break;
      default:
        break;
    }
  }, [currentTetromino, isRunning, board, onBack]);

  // 开始游戏
  function startGame() {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentTetromino(generateTetromino());
    setScore(0);
    setGameOver(false);
    setIsRunning(true);
    setGameSpeed(GAME_SPEED);
  }

  // 暂停游戏
  function toggleGame() {
    if (gameOver) {
      startGame();
    } else {
      setIsRunning(prev => !prev);
    }
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

  // 初始化游戏
  useEffect(() => {
    startGame();
  }, []);

  // 渲染游戏板
  const renderBoard = () => {
    const cells = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        let cellClass = 'tetris-cell';
        let cellStyle = {};
        
        if (cell) {
          cellClass += ' filled';
          cellStyle = { backgroundColor: TETROMINO_COLORS[cell] };
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              ...cellStyle
            }}
          />
        );
      }
    }

    // 渲染当前方块
    if (currentTetromino) {
      const { shape, position, type } = currentTetromino;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              cells[boardY * BOARD_WIDTH + boardX] = (
                <div
                  key={`${boardX}-${boardY}`}
                  className="tetris-cell filled current"
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    backgroundColor: TETROMINO_COLORS[type]
                  }}
                />
              );
            }
          }
        }
      }
    }

    return (
      <div
        className="tetris-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
          gap: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1px',
          boxShadow: '0 0 20px rgba(106, 90, 205, 0.5)'
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
          <h1 className="game-title">俄罗斯方块</h1>
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

      <div className="tetris-container">
        {renderBoard()}
        <div className="tetris-controls">
          <div className="control-group">
            <h3>控制</h3>
            <ul>
              <li>← → 移动方块</li>
              <li>↓ 加速下落</li>
              <li>↑ 旋转方块</li>
              <li>空格 快速下落</li>
              <li>ESC 返回主菜单</li>
            </ul>
          </div>
          <button className="btn btn-primary" onClick={toggleGame}>
            {isRunning ? '暂停' : gameOver ? '重新开始' : '开始'}
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="game-over">
          <h2>游戏结束</h2>
          <p>最终分数: {score}</p>
          <div>
            <button className="btn btn-primary" onClick={startGame}>重新开始</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TetrisGame;