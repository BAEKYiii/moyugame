import React, { useState, useCallback, useEffect } from 'react';

interface ColorMemoryGameProps {
  onBack: () => void;
}

function ColorMemoryGame({ onBack }: ColorMemoryGameProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('color_memory_highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  const colorNames = ['红色', '蓝色', '绿色', '黄色', '紫色', '青色'];

  const generateNextColor = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }, []);

  const showSequence = useCallback(() => {
    setIsShowing(true);
    setIsPlayerTurn(false);
    setPlayerSequence([]);

    let index = 0;
    const interval = setInterval(() => {
      if (index < sequence.length) {
        // Flash the current color
        const currentColor = sequence[index];
        const colorElements = document.querySelectorAll('.color-button');
        colorElements.forEach((element: any) => {
          if (element.style.backgroundColor === currentColor) {
            element.style.transform = 'scale(0.95)';
            element.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
            setTimeout(() => {
              element.style.transform = 'scale(1)';
              element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }, 300);
          }
        });
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsShowing(false);
          setIsPlayerTurn(true);
        }, 500);
      }
    }, 1000);
  }, [sequence]);

  const startGame = useCallback(() => {
    const newSequence = [generateNextColor()];
    setSequence(newSequence);
    setLevel(1);
    setScore(0);
    setGameOver(false);
    setTimeout(showSequence, 1000);
  }, [generateNextColor, showSequence]);

  const handleColorClick = useCallback((color: string) => {
    if (!isPlayerTurn || gameOver) return;

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    // Check if the current move is correct
    const isCorrect = newPlayerSequence.every((c, index) => c === sequence[index]);
    
    if (!isCorrect) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('color_memory_highscore', String(score));
      }
      return;
    }

    // Check if the entire sequence is correct
    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + level;
      setScore(newScore);
      const newLevel = level + 1;
      setLevel(newLevel);
      const newSequence = [...sequence, generateNextColor()];
      setSequence(newSequence);
      setTimeout(showSequence, 1000);
    }
  }, [isPlayerTurn, gameOver, playerSequence, sequence, score, level, highScore, generateNextColor, showSequence]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>色彩记忆</h2>
        <div style={styles.stats}>
          <span>分数: {score}</span>
          <span style={styles.separator}>|</span>
          <span>最高分: {highScore}</span>
        </div>
      </div>

      <div style={styles.gameInfo}>
        <h3 style={styles.level}>关卡: {level}</h3>
        {isShowing && <p style={styles.message}>记住颜色顺序...</p>}
        {isPlayerTurn && <p style={styles.message}>重复颜色顺序...</p>}
        {!isShowing && !isPlayerTurn && !gameOver && <p style={styles.message}>准备开始...</p>}
      </div>

      <div style={styles.colorGrid}>
        {colors.map((color, index) => (
          <button
            key={index}
            className="color-button"
            onClick={() => handleColorClick(color)}
            style={{
              ...styles.colorButton,
              backgroundColor: color,
              cursor: isPlayerTurn && !gameOver ? 'pointer' : 'default',
              opacity: isPlayerTurn && !gameOver ? 1 : 0.7,
            }}
          >
            <span style={styles.colorName}>{colorNames[index]}</span>
          </button>
        ))}
      </div>

      {gameOver && (
        <div style={styles.gameOverOverlay}>
          <div style={styles.gameOverMessage}>
            <h2>🎮 游戏结束！</h2>
            <p>最终分数: {score}</p>
            <p>最高关卡: {level - 1}</p>
            {score > highScore && <p style={styles.newHighScore}>🏆 新纪录！</p>}
            <button onClick={startGame} style={styles.playAgainButton}>再玩一次</button>
          </div>
        </div>
      )}

      <div style={styles.controls}>
        {!isShowing && !isPlayerTurn && !gameOver && (
          <button onClick={startGame} style={styles.startButton}>开始游戏</button>
        )}
        <p style={styles.hint}>记住并重复显示的颜色顺序</p>
        <p style={styles.subHint}>颜色会一个接一个地闪烁</p>
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
    maxWidth: '500px',
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
  gameInfo: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  level: {
    fontSize: '24px',
    color: '#333',
    margin: '0 0 10px 0',
  },
  message: {
    fontSize: '18px',
    color: '#666',
    margin: '0',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 120px)',
    gridTemplateRows: 'repeat(2, 120px)',
    gap: '15px',
    marginBottom: '30px',
  },
  colorButton: {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorName: {
    color: 'white',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  gameOverOverlay: {
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
  gameOverMessage: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  newHighScore: {
    color: '#f39c12',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  playAgainButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  controls: {
    textAlign: 'center',
  },
  startButton: {
    padding: '15px 30px',
    fontSize: '20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  hint: {
    color: '#666',
    fontSize: '16px',
    margin: '5px 0',
  },
  subHint: {
    color: '#27ae60',
    fontSize: '14px',
    margin: '5px 0',
  },
};

export default ColorMemoryGame;