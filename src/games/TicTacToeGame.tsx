import React, { useState, useCallback } from 'react';

interface TicTacToeGameProps {
  onBack: () => void;
}

function TicTacToeGame({ onBack }: TicTacToeGameProps) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [mode, setMode] = useState<'vsPlayer' | 'vsAI'>('vsPlayer');

  const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  const checkWinner = useCallback((boardState: string[]) => {
    for (const condition of winningConditions) {
      const [a, b, c] = condition;
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return boardState[a];
      }
    }
    if (boardState.every(cell => cell)) {
      return 'draw';
    }
    return null;
  }, []);

  const makeAIMove = useCallback(() => {
    if (gameOver || currentPlayer !== 'O') return;

    // Simple AI: first available move
    let move = -1;
    
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        const newBoard = [...board];
        newBoard[i] = 'O';
        if (checkWinner(newBoard) === 'O') {
          move = i;
          break;
        }
      }
    }

    // Try to block player
    if (move === -1) {
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
          const newBoard = [...board];
          newBoard[i] = 'X';
          if (checkWinner(newBoard) === 'X') {
            move = i;
            break;
          }
        }
      }
    }

    // Pick center if available
    if (move === -1 && board[4] === '') {
      move = 4;
    }

    // Pick random move
    if (move === -1) {
      const availableMoves = board.map((cell, index) => index).filter(index => board[index] === '');
      if (availableMoves.length > 0) {
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    if (move !== -1) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);
      
      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setGameOver(true);
        if (gameWinner === 'O') {
          setScoreO(prev => prev + 1);
        } else if (gameWinner === 'X') {
          setScoreX(prev => prev + 1);
        }
      } else {
        setCurrentPlayer('X');
      }
    }
  }, [board, currentPlayer, gameOver, checkWinner]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameOver(true);
      if (gameWinner === 'X') {
        setScoreX(prev => prev + 1);
      } else if (gameWinner === 'O') {
        setScoreO(prev => prev + 1);
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, gameOver, checkWinner]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setWinner(null);
    setGameOver(false);
  }, []);

  const resetScores = useCallback(() => {
    setScoreX(0);
    setScoreO(0);
    resetGame();
  }, [resetGame]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>井字棋</h2>
        <div style={styles.stats}>
          <span>X: {scoreX}</span>
          <span style={styles.separator}>|</span>
          <span>O: {scoreO}</span>
        </div>
      </div>

      <div style={styles.modeSelector}>
        <button
          onClick={() => setMode('vsPlayer')}
          style={{
            ...styles.modeButton,
            backgroundColor: mode === 'vsPlayer' ? '#3498db' : '#bdc3c7',
            color: mode === 'vsPlayer' ? 'white' : '#333',
          }}
        >
          双人模式
        </button>
        <button
          onClick={() => setMode('vsAI')}
          style={{
            ...styles.modeButton,
            backgroundColor: mode === 'vsAI' ? '#3498db' : '#bdc3c7',
            color: mode === 'vsAI' ? 'white' : '#333',
          }}
        >
          人机模式
        </button>
      </div>

      <div style={styles.gameBoard}>
        {board.map((cell, index) => (
          <div
            key={index}
            onClick={() => handleCellClick(index)}
            style={{
              ...styles.cell,
              cursor: board[index] || gameOver ? 'default' : 'pointer',
            }}
          >
            <span style={{ ...styles.cellValue, color: cell === 'X' ? '#3498db' : '#e74c3c' }}>
              {cell}
            </span>
          </div>
        ))}
      </div>

      {gameOver && (
        <div style={styles.winOverlay}>
          <div style={styles.winMessage}>
            <h2>
              {winner === 'draw' ? '🤝 平局！' : `🎉 ${winner === 'X' ? 'X' : 'O'} 获胜！`}
            </h2>
            <div style={styles.winButtons}>
              <button onClick={resetGame} style={styles.playAgainButton}>再玩一次</button>
              <button onClick={resetScores} style={styles.resetButton}>重置分数</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <p style={styles.hint}>点击格子放置 {currentPlayer}</p>
        {mode === 'vsAI' && currentPlayer === 'O' && <p style={styles.aiTurn}>AI 思考中...</p>}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '24px',
    margin: '0',
    color: '#333',
  },
  stats: {
    fontSize: '16px',
    color: '#666',
  },
  separator: {
    margin: '0 10px',
  },
  modeSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  modeButton: {
    padding: '10px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  gameBoard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 100px)',
    gridTemplateRows: 'repeat(3, 100px)',
    gap: '10px',
    backgroundColor: '#bdc3c7',
    padding: '15px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  cellValue: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  winOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  winMessage: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  winButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  playAgainButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  resetButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  controls: {
    marginTop: '30px',
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    fontSize: '16px',
  },
  aiTurn: {
    color: '#3498db',
    fontSize: '14px',
    marginTop: '5px',
    fontWeight: 'bold',
  },
};

export default TicTacToeGame;