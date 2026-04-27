import React, { useState, useCallback, useEffect } from 'react';

// 数独游戏配置
const GRID_SIZE = 9;
const BOX_SIZE = 3;

// 数独单元格类型
type Cell = {
  value: number;
  fixed: boolean;
  notes: number[];
};

// 生成随机数独
const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard'): Cell[][] => {
  // 生成完整数独
  const generateCompleteSudoku = (): number[][] => {
    const grid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    
    const isValid = (row: number, col: number, num: number): boolean => {
      // 检查行
      for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[row][i] === num) return false;
      }
      
      // 检查列
      for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[i][col] === num) return false;
      }
      
      // 检查3x3宫格
      const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
      const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
      for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
          if (grid[boxRow + i][boxCol + j] === num) return false;
        }
      }
      
      return true;
    };
    
    const solve = (): boolean => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === 0) {
            const nums = Array.from({ length: GRID_SIZE }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
            for (const num of nums) {
              if (isValid(row, col, num)) {
                grid[row][col] = num;
                if (solve()) return true;
                grid[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    
    solve();
    return grid;
  };
  
  // 根据难度移除数字
  const completeGrid = generateCompleteSudoku();
  const grid: Cell[][] = completeGrid.map(row => 
    row.map(value => ({ value, fixed: true, notes: [] }))
  );
  
  let cellsToRemove: number;
  switch (difficulty) {
    case 'easy':
      cellsToRemove = 40;
      break;
    case 'medium':
      cellsToRemove = 50;
      break;
    case 'hard':
      cellsToRemove = 60;
      break;
  }
  
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (grid[row][col].value !== 0) {
      grid[row][col].value = 0;
      grid[row][col].fixed = false;
      cellsToRemove--;
    }
  }
  
  return grid;
};

// 检查数独是否完成
const checkSudokuComplete = (grid: Cell[][]): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value === 0) return false;
    }
  }
  return true;
};

// 检查数独是否有效
const checkSudokuValid = (grid: Cell[][]): boolean => {
  // 检查每行
  for (let row = 0; row < GRID_SIZE; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col].value;
      if (value !== 0 && seen.has(value)) return false;
      seen.add(value);
    }
  }
  
  // 检查每列
  for (let col = 0; col < GRID_SIZE; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < GRID_SIZE; row++) {
      const value = grid[row][col].value;
      if (value !== 0 && seen.has(value)) return false;
      seen.add(value);
    }
  }
  
  // 检查每个3x3宫格
  for (let boxRow = 0; boxRow < BOX_SIZE; boxRow++) {
    for (let boxCol = 0; boxCol < BOX_SIZE; boxCol++) {
      const seen = new Set<number>();
      for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
          const value = grid[boxRow * BOX_SIZE + i][boxCol * BOX_SIZE + j].value;
          if (value !== 0 && seen.has(value)) return false;
          seen.add(value);
        }
      }
    }
  }
  
  return true;
};

interface SudokuGameProps {
  onBack: () => void;
}

function SudokuGame({ onBack }: SudokuGameProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [grid, setGrid] = useState<Cell[][]>(generateSudoku('easy'));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [highScores, setHighScores] = useState<{ [key: string]: number }>({
    easy: 99999,
    medium: 99999,
    hard: 99999
  });

  // 开始新游戏
  const startNewGame = useCallback(() => {
    setGrid(generateSudoku(difficulty));
    setSelectedCell(null);
    setNotesMode(false);
    setGameOver(false);
    setMoves(0);
    setTime(0);
    setTimerRunning(true);
  }, [difficulty]);

  // 处理单元格点击
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  // 处理数字输入
  const handleNumberInput = useCallback((number: number) => {
    if (!selectedCell || gameOver) return;
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const { row, col } = selectedCell;
      
      if (newGrid[row][col].fixed) return prevGrid;
      
      if (notesMode) {
        // 笔记模式：添加或移除笔记
        if (newGrid[row][col].notes.includes(number)) {
          newGrid[row][col].notes = newGrid[row][col].notes.filter(n => n !== number);
        } else {
          newGrid[row][col].notes = [...newGrid[row][col].notes, number].sort();
        }
      } else {
        // 普通模式：设置数字
        if (newGrid[row][col].value !== number) {
          newGrid[row][col].value = number;
          newGrid[row][col].notes = [];
          setMoves(prev => prev + 1);
        }
      }
      
      return newGrid;
    });
  }, [selectedCell, gameOver, notesMode]);

  // 处理删除
  const handleDelete = useCallback(() => {
    if (!selectedCell || gameOver) return;
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const { row, col } = selectedCell;
      
      if (newGrid[row][col].fixed) return prevGrid;
      
      newGrid[row][col].value = 0;
      newGrid[row][col].notes = [];
      setMoves(prev => prev + 1);
      
      return newGrid;
    });
  }, [selectedCell, gameOver]);

  // 检查游戏是否完成
  useEffect(() => {
    if (checkSudokuComplete(grid) && checkSudokuValid(grid)) {
      setGameOver(true);
      setTimerRunning(false);
      setHighScores(prev => ({
        ...prev,
        [difficulty]: Math.min(prev[difficulty], time)
      }));
    }
  }, [grid, difficulty, time]);

  // 游戏计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 渲染数独网格
  const renderGrid = () => {
    return (
      <div className="sudoku-grid" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '1px',
        width: '450px',
        height: '450px',
        margin: '2rem auto',
        backgroundColor: '#333',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
      }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isBoxBorderRow = rowIndex % BOX_SIZE === 0;
            const isBoxBorderCol = colIndex % BOX_SIZE === 0;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="sudoku-cell"
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: cell.fixed ? '#f0f0f0' : '#fff',
                  cursor: cell.fixed ? 'default' : 'pointer',
                  border: isSelected ? '2px solid #6a5acd' : '1px solid #ddd',
                  borderTop: isBoxBorderRow ? '2px solid #333' : '1px solid #ddd',
                  borderLeft: isBoxBorderCol ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: isSelected ? '4px' : '0',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {cell.value !== 0 ? (
                  <span style={{
                    fontSize: '24px',
                    fontWeight: cell.fixed ? 'bold' : 'normal',
                    color: cell.fixed ? '#333' : '#6a5acd'
                  }}>
                    {cell.value}
                  </span>
                ) : cell.notes.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(3, 1fr)',
                    width: '100%',
                    height: '100%',
                    padding: '2px'
                  }}>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                      <div key={num} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        color: cell.notes.includes(num) ? '#666' : 'transparent'
                      }}>
                        {num}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // 渲染数字键盘
  const renderNumberPad = () => {
    return (
      <div className="number-pad" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        width: '450px',
        margin: '1rem auto',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '8px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            style={{
              padding: '15px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => setNotesMode(!notesMode)}
          style={{
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: notesMode ? '#6a5acd' : '#f0f0f0',
            color: notesMode ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notesMode ? '#5a4ac0' : '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notesMode ? '#6a5acd' : '#f0f0f0'}
        >
          笔记
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            gridColumn: 'span 2'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        >
          删除
        </button>
        <button
          onClick={startNewGame}
          style={{
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#6a5acd',
            color: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            gridColumn: 'span 2'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4ac0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6a5acd'}
        >
          新游戏
        </button>
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
            数独游戏
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>时间</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{formatTime(time)}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>步数</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{moves}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>最高分</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{formatTime(highScores[difficulty])}</span>
          </div>
        </div>
      </div>

      <div className="difficulty-selector" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {(['easy', 'medium', 'hard'] as const).map(level => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: difficulty === level ? '#6a5acd' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = difficulty === level ? '#5a4ac0' : '#555'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = difficulty === level ? '#6a5acd' : '#444'}
          >
            {level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难'}
          </button>
        ))}
      </div>

      {renderGrid()}
      {renderNumberPad()}

      {gameOver && (
        <div className="game-over" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '12px',
          color: 'white',
          zIndex: 1000
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>恭喜！</h2>
          <p style={{ fontSize: '20px', marginBottom: '20px' }}>你完成了数独游戏！</p>
          <p style={{ fontSize: '18px', marginBottom: '5px' }}>时间: {formatTime(time)}</p>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>步数: {moves}</p>
          {time < highScores[difficulty] && (
            <p style={{ fontSize: '20px', color: '#ffd700', marginBottom: '30px' }}>新纪录！</p>
          )}
          <button 
            className="new-game-btn"
            onClick={startNewGame}
            style={{
              padding: '15px 30px',
              backgroundColor: '#6a5acd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4ac0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6a5acd'}
          >
            新游戏
          </button>
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
        <p>1. 在9x9的网格中填入1-9的数字</p>
        <p>2. 每行、每列和每个3x3宫格中不能有重复数字</p>
        <p>3. 点击单元格选择，使用数字键盘输入</p>
        <p>4. 点击"笔记"按钮进入笔记模式，可以标记可能的数字</p>
        <p>5. 点击"删除"按钮清除单元格内容</p>
        <p>6. 选择不同难度级别挑战自己</p>
      </div>
    </div>
  );
}

export default SudokuGame;