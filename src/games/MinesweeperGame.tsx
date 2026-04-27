import React, { useState, useCallback, useEffect } from 'react';

// 游戏难度配置
interface Difficulty {
  name: string;
  boardSize: number;
  mineCount: number;
  color: string;
}

const DIFFICULTIES: Record<string, Difficulty> = {
  easy: {
    name: '简单',
    boardSize: 9,
    mineCount: 10,
    color: '#4CAF50'
  },
  medium: {
    name: '中等',
    boardSize: 16,
    mineCount: 40,
    color: '#FF9800'
  },
  hard: {
    name: '困难',
    boardSize: 24,
    mineCount: 99,
    color: '#F44336'
  }
};

// 单元格状态
type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

// 棋盘类型
type Board = Cell[][];
// 难度类型
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface MinesweeperGameProps {
  onBack: () => void;
}

function MinesweeperGame({ onBack }: MinesweeperGameProps) {
  const [board, setBoard] = useState<Board>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [message, setMessage] = useState('点击格子开始游戏');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');

  // 初始化棋盘
  const initBoard = useCallback(() => {
    const { boardSize, mineCount } = DIFFICULTIES[difficulty];
    
    // 创建空白棋盘
    const newBoard: Board = [];
    for (let i = 0; i < boardSize; i++) {
      newBoard.push([]);
      for (let j = 0; j < boardSize; j++) {
        newBoard[i].push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        });
      }
    }

    // 随机放置地雷
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // 计算每个格子周围的地雷数
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (!newBoard[i][j].isMine) {
          let count = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && newBoard[ni][nj].isMine) {
                count++;
              }
            }
          }
          newBoard[i][j].adjacentMines = count;
        }
      }
    }

    setBoard(newBoard);
    setGameOver(false);
    setGameWon(false);
    setRevealedCount(0);
    setMessage('点击格子开始游戏');
  }, [difficulty]);

  // 揭示格子
  const revealCell = useCallback((row: number, col: number) => {
    if (gameOver || gameWon || board[row][col].isRevealed || board[row][col].isFlagged) return;

    const { boardSize, mineCount } = DIFFICULTIES[difficulty];
    const newBoard = JSON.parse(JSON.stringify(board)) as Board;
    
    // 如果踩到地雷
    if (newBoard[row][col].isMine) {
      // 揭示所有地雷
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          if (newBoard[i][j].isMine) {
            newBoard[i][j].isRevealed = true;
          }
        }
      }
      setBoard(newBoard);
      setGameOver(true);
      setMessage('游戏结束！你踩到了地雷！');
      return;
    }

    // 揭示当前格子
    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return;
      if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged || newBoard[r][c].isMine) return;

      newBoard[r][c].isRevealed = true;
      setRevealedCount(prev => prev + 1);

      // 如果周围没有地雷，递归揭示周围的格子
      if (newBoard[r][c].adjacentMines === 0) {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            reveal(r + di, c + dj);
          }
        }
      }
    };

    reveal(row, col);
    setBoard(newBoard);

    // 检查是否获胜
    const totalSafeCells = boardSize * boardSize - mineCount;
    if (revealedCount + 1 === totalSafeCells) {
      setGameWon(true);
      setMessage('恭喜你获胜了！');
    }
  }, [board, gameOver, gameWon, revealedCount, difficulty]);

  // 标记格子
  const toggleFlag = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault(); // 阻止默认的右键菜单
    if (gameOver || gameWon || board[row][col].isRevealed) return;

    const newBoard = JSON.parse(JSON.stringify(board)) as Board;
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
  }, [board, gameOver, gameWon]);

  // 初始化游戏
  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // 渲染棋盘
  const renderBoard = () => {
    const { boardSize } = DIFFICULTIES[difficulty];
    // 设置固定的单元格大小，确保足够容纳内容
    const cellSize = 25; // 固定单元格大小
    const boardWidth = boardSize * cellSize;
    
    return (
      <div
        className="minesweeper-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
          gap: '2px',
          width: `${boardWidth}px`,
          height: `${boardWidth}px`,
          margin: '2rem auto',
          backgroundColor: '#333',
          padding: '15px',
          borderRadius: '12px',
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.6)',
          border: '3px solid #555',
          overflow: 'auto'
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="minesweeper-cell"
              onClick={() => revealCell(rowIndex, colIndex)}
              onContextMenu={(e) => toggleFlag(e, rowIndex, colIndex)}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundColor: cell.isRevealed ? '#f0f0f0' : '#999',
                cursor: gameOver || gameWon ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: cellSize <= 20 ? '12px' : cellSize <= 30 ? '16px' : '20px',
                fontWeight: 'bold',
                border: '2px solid #666',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                boxShadow: cell.isRevealed ? 'inset 0 0 5px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!gameOver && !gameWon && !cell.isRevealed && !cell.isFlagged) {
                  e.currentTarget.style.backgroundColor = '#aaa';
                }
              }}
              onMouseLeave={(e) => {
                if (!gameOver && !gameWon && !cell.isRevealed && !cell.isFlagged) {
                  e.currentTarget.style.backgroundColor = '#999';
                }
              }}
            >
              {cell.isRevealed ? (
                cell.isMine ? (
                  <span style={{ 
                    color: 'red', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}>💣</span>
                ) : cell.adjacentMines > 0 ? (
                  <span style={{ 
                    color: [
                      'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'
                    ][cell.adjacentMines - 1],
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}>
                    {cell.adjacentMines}
                  </span>
                ) : (
                  <div style={{ 
                    width: '80%', 
                    height: '80%', 
                    backgroundColor: '#e0e0e0',
                    borderRadius: '2px',
                    boxShadow: 'inset 0 0 3px rgba(0, 0, 0, 0.2)'
                  }} />
                )
              ) : cell.isFlagged ? (
                <span style={{ 
                  color: 'red', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden'
                }}>🚩</span>
              ) : null}
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
            扫雷
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>地雷数</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{DIFFICULTIES[difficulty].mineCount}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>难度</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: DIFFICULTIES[difficulty].color }}>{DIFFICULTIES[difficulty].name}</span>
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
        gap: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button 
          className="control-btn"
          onClick={initBoard}
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              className="difficulty-btn"
              onClick={() => {
                setDifficulty(level);
                initBoard();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: difficulty === level ? DIFFICULTIES[level].color : '#444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = difficulty === level ? DIFFICULTIES[level].color : '#555'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = difficulty === level ? DIFFICULTIES[level].color : '#444'}
            >
              {DIFFICULTIES[level].name}
            </button>
          ))}
        </div>
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
        <p>1. 左键点击格子揭示内容</p>
        <p>2. 右键点击格子标记为地雷</p>
        <p>3. 揭示所有非地雷格子获胜</p>
        <p>4. 踩到地雷游戏结束</p>
      </div>
    </div>
  );
}

export default MinesweeperGame;