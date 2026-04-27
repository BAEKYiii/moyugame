import React, { useState, useCallback, useEffect } from 'react';

// 游戏配置
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 棋盘类型
type Board = number[][];
// 游戏模式类型
type GameMode = 'human' | 'ai';

interface GomokuGameProps {
  onBack: () => void;
}

function GomokuGame({ onBack }: GomokuGameProps) {
  const [board, setBoard] = useState<Board>(() => {
    const newBoard: Board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      newBoard.push(Array(BOARD_SIZE).fill(EMPTY));
    }
    return newBoard;
  });
  const [currentPlayer, setCurrentPlayer] = useState(BLACK);
  const [winner, setWinner] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('黑棋先行');
  const [gameMode, setGameMode] = useState<GameMode>('human');
  const [isAIMoving, setIsAIMoving] = useState(false);

  // 检查是否有获胜者
  const checkWinner = useCallback((row: number, col: number, player: number) => {
    // 检查水平方向
    let count = 1;
    for (let c = col + 1; c < BOARD_SIZE; c++) {
      if (board[row][c] === player) count++;
      else break;
    }
    for (let c = col - 1; c >= 0; c--) {
      if (board[row][c] === player) count++;
      else break;
    }
    if (count >= 5) return true;

    // 检查垂直方向
    count = 1;
    for (let r = row + 1; r < BOARD_SIZE; r++) {
      if (board[r][col] === player) count++;
      else break;
    }
    for (let r = row - 1; r >= 0; r--) {
      if (board[r][col] === player) count++;
      else break;
    }
    if (count >= 5) return true;

    // 检查对角线方向 (↘)
    count = 1;
    for (let r = row + 1, c = col + 1; r < BOARD_SIZE && c < BOARD_SIZE; r++, c++) {
      if (board[r][c] === player) count++;
      else break;
    }
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) {
      if (board[r][c] === player) count++;
      else break;
    }
    if (count >= 5) return true;

    // 检查对角线方向 (↙)
    count = 1;
    for (let r = row + 1, c = col - 1; r < BOARD_SIZE && c >= 0; r++, c--) {
      if (board[r][c] === player) count++;
      else break;
    }
    for (let r = row - 1, c = col + 1; r >= 0 && c < BOARD_SIZE; r--, c++) {
      if (board[r][c] === player) count++;
      else break;
    }
    if (count >= 5) return true;

    return false;
  }, [board]);

  // 评估位置的得分
  const evaluatePosition = useCallback((row: number, col: number, player: number) => {
    if (board[row][col] !== EMPTY) return -1;

    let score = 0;
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线 (↘)
      [1, -1]   // 对角线 (↙)
    ];

    for (const [dr, dc] of directions) {
      let currentScore = 0;
      let consecutive = 0;
      let blocked = 0;

      // 检查正方向
      for (let i = 1; i <= 4; i++) {
        const nr = row + dr * i;
        const nc = col + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            consecutive++;
          } else if (board[nr][nc] === EMPTY) {
            break;
          } else {
            blocked++;
            break;
          }
        } else {
          blocked++;
          break;
        }
      }

      // 检查反方向
      for (let i = 1; i <= 4; i++) {
        const nr = row - dr * i;
        const nc = col - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            consecutive++;
          } else if (board[nr][nc] === EMPTY) {
            break;
          } else {
            blocked++;
            break;
          }
        } else {
          blocked++;
          break;
        }
      }

      // 根据连续子数计算得分
      if (consecutive === 4) {
        currentScore = 10000; // 四连子，即将获胜
      } else if (consecutive === 3 && blocked === 0) {
        currentScore = 1000; // 活三连
      } else if (consecutive === 3 && blocked === 1) {
        currentScore = 100; // 冲四
      } else if (consecutive === 2 && blocked === 0) {
        currentScore = 50; // 活二连
      } else if (consecutive === 2 && blocked === 1) {
        currentScore = 10; // 冲三
      } else if (consecutive === 1) {
        currentScore = 1; // 单子
      }

      score += currentScore;
    }

    return score;
  }, [board]);

  // AI移动
  const aiMove = useCallback(() => {
    if (gameOver || gameMode !== 'ai' || currentPlayer !== WHITE) return;

    setIsAIMoving(true);

    // 简单的AI算法：评估每个位置的得分
    let bestScore = -1;
    let bestMove: [number, number] | null = null;

    // 优先检查中心区域
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);
    const searchRadius = 3;

    // 先检查中心区域
    for (let r = Math.max(0, centerRow - searchRadius); r <= Math.min(BOARD_SIZE - 1, centerRow + searchRadius); r++) {
      for (let c = Math.max(0, centerCol - searchRadius); c <= Math.min(BOARD_SIZE - 1, centerCol + searchRadius); c++) {
        if (board[r][c] === EMPTY) {
          const score = evaluatePosition(r, c, WHITE);
          if (score > bestScore) {
            bestScore = score;
            bestMove = [r, c];
          }
        }
      }
    }

    // 如果中心区域没有好位置，检查整个棋盘
    if (bestMove === null) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === EMPTY) {
            const score = evaluatePosition(r, c, WHITE);
            if (score > bestScore) {
              bestScore = score;
              bestMove = [r, c];
            }
          }
        }
      }
    }

    // 检查是否需要防守
    let defenseScore = -1;
    let defenseMove: [number, number] | null = null;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) {
          const score = evaluatePosition(r, c, BLACK);
          if (score > defenseScore) {
            defenseScore = score;
            defenseMove = [r, c];
          }
        }
      }
    }

    // 如果防守得分高于进攻得分，优先防守
    if (defenseScore > bestScore) {
      bestMove = defenseMove;
    }

    // 如果没有找到任何位置，随机选择一个
    if (bestMove === null) {
      const emptyPositions: [number, number][] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === EMPTY) {
            emptyPositions.push([r, c]);
          }
        }
      }
      if (emptyPositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        bestMove = emptyPositions[randomIndex];
      }
    }

    // 执行AI移动
    if (bestMove) {
      setTimeout(() => {
        const [row, col] = bestMove!;
        const newBoard = [...board.map(row => [...row])];
        newBoard[row][col] = WHITE;
        setBoard(newBoard);

        if (checkWinner(row, col, WHITE)) {
          setWinner(WHITE);
          setGameOver(true);
          setMessage('白棋获胜！');
        } else {
          setCurrentPlayer(BLACK);
          setMessage('黑棋回合');
        }
        setIsAIMoving(false);
      }, 500); // 延迟500ms，让AI移动看起来更自然
    } else {
      setIsAIMoving(false);
    }
  }, [board, currentPlayer, gameMode, gameOver, checkWinner, evaluatePosition]);

  // 处理落子
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || board[row][col] !== EMPTY || isAIMoving) return;

    const newBoard = [...board.map(row => [...row])];
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(row, col, currentPlayer)) {
      setWinner(currentPlayer);
      setGameOver(true);
      setMessage(currentPlayer === BLACK ? '黑棋获胜！' : '白棋获胜！');
    } else {
      setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
      setMessage(currentPlayer === BLACK ? '白棋回合' : '黑棋回合');
    }
  }, [board, currentPlayer, gameOver, checkWinner, isAIMoving]);

  // 重置游戏
  const resetGame = useCallback(() => {
    const newBoard: Board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      newBoard.push(Array(BOARD_SIZE).fill(EMPTY));
    }
    setBoard(newBoard);
    setCurrentPlayer(BLACK);
    setWinner(null);
    setGameOver(false);
    setMessage('黑棋先行');
    setIsAIMoving(false);
  }, []);

  // AI自动落子
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === WHITE && !gameOver && !isAIMoving) {
      aiMove();
    }
  }, [gameMode, currentPlayer, gameOver, isAIMoving, aiMove]);

  // 渲染棋盘
  const renderBoard = () => {
    return (
      <div
        className="gomoku-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          gap: '2px',
          width: '450px',
          height: '450px',
          margin: '2rem auto',
          backgroundColor: '#8B4513',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="gomoku-cell"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#DEB887',
                cursor: gameOver || cell !== EMPTY ? 'default' : 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cell === BLACK && (
                <div
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '50%',
                    backgroundColor: 'black'
                  }}
                />
              )}
              {cell === WHITE && (
                <div
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '1px solid black'
                  }}
                />
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
            五子棋
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>当前玩家</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>
              {currentPlayer === BLACK ? '黑棋' : '白棋'}
            </span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>游戏模式</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>
              {gameMode === 'human' ? '双人' : '人机'}
            </span>
          </div>
        </div>
      </div>

      <div className="game-message" style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        {message}
      </div>

      {renderBoard()}

      <div className="control-buttons" style={{
        marginTop: '30px',
        display: 'flex',
        gap: '20px'
      }}>
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
          🔄 重新开始
        </button>
        <button 
          className="control-btn"
          onClick={() => {
            setGameMode(gameMode === 'human' ? 'ai' : 'human');
            resetGame();
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: gameMode === 'ai' ? '#4CAF50' : '#6a5acd',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = gameMode === 'ai' ? '#45a049' : '#5a4ac0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = gameMode === 'ai' ? '#4CAF50' : '#6a5acd'}
        >
          {gameMode === 'human' ? '🤖 切换到人机' : '👥 切换到双人'}
        </button>
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
        <p>1. 黑棋先行，黑白双方轮流落子</p>
        <p>2. 率先在一条直线上形成五连子的一方获胜</p>
        <p>3. 五连子可以是水平、垂直或对角线方向</p>
      </div>
    </div>
  );
}

export default GomokuGame;