import React, { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GRID_SIZE = 8;
const GEM_TYPES = ['💎', '🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const MIN_MATCH = 3;

// 宝石类型
type Gem = {
  id: number;
  type: string;
  row: number;
  col: number;
  isSelected: boolean;
  isMatched: boolean;
};

interface Match3GameProps {
  onBack: () => void;
}

function Match3Game({ onBack }: Match3GameProps) {
  const [grid, setGrid] = useState<Gem[]>([]);
  const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // 动画帧引用
  const animationFrameRef = useRef<number>();

  // 初始化游戏
  const initGame = useCallback(() => {
    const validGrid = generateValidGrid();
    setGrid(validGrid);
    setSelectedGem(null);
    setScore(0);
    setMoves(0);
    setLevel(1);
    setTargetScore(1000);
    setIsAnimating(false);
    setShowLevelUp(false);
    setGameOver(false);
  }, []);

  // 生成有效宝石网格（避免初始匹配）
  const generateValidGrid = useCallback(() => {
    let validGrid: Gem[] = [];
    let hasMatches = true;

    while (hasMatches) {
      validGrid = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const id = row * GRID_SIZE + col;
          validGrid[id] = {
            id,
            type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
            row,
            col,
            isSelected: false,
            isMatched: false
          };
        }
      }
      hasMatches = findMatches(validGrid).length > 0;
    }

    return validGrid;
  }, []);

  // 查找匹配
  const findMatches = useCallback((currentGrid: Gem[]) => {
    const matches: Gem[][] = [];
    const visited = new Set<number>();

    // 检查水平匹配
    for (let row = 0; row < GRID_SIZE; row++) {
      let col = 0;
      while (col < GRID_SIZE - 2) {
        const gem1 = currentGrid[row * GRID_SIZE + col];
        const gem2 = currentGrid[row * GRID_SIZE + col + 1];
        const gem3 = currentGrid[row * GRID_SIZE + col + 2];

        if (gem1.type === gem2.type && gem2.type === gem3.type && 
            !gem1.isMatched && !gem2.isMatched && !gem3.isMatched &&
            !visited.has(gem1.id) && !visited.has(gem2.id) && !visited.has(gem3.id)) {
          const match = [gem1, gem2, gem3];
          match.forEach(gem => visited.add(gem.id));
          
          // 检查是否有更多连续匹配
          let nextCol = col + 3;
          while (nextCol < GRID_SIZE) {
            const nextGem = currentGrid[row * GRID_SIZE + nextCol];
            if (nextGem.type === gem1.type && !nextGem.isMatched && !visited.has(nextGem.id)) {
              match.push(nextGem);
              visited.add(nextGem.id);
              nextCol++;
            } else {
              break;
            }
          }
          
          matches.push(match);
          col = nextCol;
        } else {
          col++;
        }
      }
    }

    // 检查垂直匹配
    for (let col = 0; col < GRID_SIZE; col++) {
      let row = 0;
      while (row < GRID_SIZE - 2) {
        const gem1 = currentGrid[row * GRID_SIZE + col];
        const gem2 = currentGrid[(row + 1) * GRID_SIZE + col];
        const gem3 = currentGrid[(row + 2) * GRID_SIZE + col];

        if (gem1.type === gem2.type && gem2.type === gem3.type && 
            !gem1.isMatched && !gem2.isMatched && !gem3.isMatched &&
            !visited.has(gem1.id) && !visited.has(gem2.id) && !visited.has(gem3.id)) {
          const match = [gem1, gem2, gem3];
          match.forEach(gem => visited.add(gem.id));
          
          // 检查是否有更多连续匹配
          let nextRow = row + 3;
          while (nextRow < GRID_SIZE) {
            const nextGem = currentGrid[nextRow * GRID_SIZE + col];
            if (nextGem.type === gem1.type && !nextGem.isMatched && !visited.has(nextGem.id)) {
              match.push(nextGem);
              visited.add(nextGem.id);
              nextRow++;
            } else {
              break;
            }
          }
          
          matches.push(match);
          row = nextRow;
        } else {
          row++;
        }
      }
    }

    return matches;
  }, []);

  // 应用重力
  const applyGravity = useCallback((currentGrid: Gem[]) => {
    const newGrid = new Array(GRID_SIZE * GRID_SIZE).fill(null);
    
    for (let col = 0; col < GRID_SIZE; col++) {
      // 从底部开始，将宝石向下移动
      let emptyRow = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const gem = currentGrid[row * GRID_SIZE + col];
        if (gem && !gem.isMatched && gem.type) {
          // 将宝石移动到空位置
          const newIndex = emptyRow * GRID_SIZE + col;
          newGrid[newIndex] = {
            ...gem,
            id: newIndex,
            row: emptyRow,
            col
          };
          emptyRow--;
        }
      }
      
      // 在顶部生成新宝石，确保不会立即形成匹配
      for (let row = 0; row <= emptyRow; row++) {
        let validType = '';
        let hasMatch = true;
        
        while (hasMatch) {
          validType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
          
          // 检查水平方向是否形成匹配
          const left1 = row * GRID_SIZE + col - 1;
          const left2 = row * GRID_SIZE + col - 2;
          const right1 = row * GRID_SIZE + col + 1;
          const right2 = row * GRID_SIZE + col + 2;
          
          // 检查垂直方向是否形成匹配
          const up1 = (row - 1) * GRID_SIZE + col;
          const up2 = (row - 2) * GRID_SIZE + col;
          
          hasMatch = false;
          
          // 检查水平匹配
          if (col >= 2 && 
              newGrid[left1]?.type === validType && 
              newGrid[left2]?.type === validType) {
            hasMatch = true;
          } else if (col >= 1 && col < GRID_SIZE - 1 && 
                     newGrid[left1]?.type === validType && 
                     newGrid[right1]?.type === validType) {
            hasMatch = true;
          } else if (col < GRID_SIZE - 2 && 
                     newGrid[right1]?.type === validType && 
                     newGrid[right2]?.type === validType) {
            hasMatch = true;
          }
          
          // 检查垂直匹配
          if (!hasMatch && row >= 2 && 
              newGrid[up1]?.type === validType && 
              newGrid[up2]?.type === validType) {
            hasMatch = true;
          } else if (!hasMatch && row >= 1 && row < GRID_SIZE - 1 && 
                     newGrid[up1]?.type === validType) {
            // 检查下方是否有宝石
            const down1 = (row + 1) * GRID_SIZE + col;
            if (newGrid[down1]?.type === validType) {
              hasMatch = true;
            }
          }
        }
        
        const newIndex = row * GRID_SIZE + col;
        newGrid[newIndex] = {
          id: newIndex,
          type: validType,
          row,
          col,
          isSelected: false,
          isMatched: false
        };
      }
    }
    
    return newGrid;
  }, []);

  // 检查是否有可移动的宝石
  const checkMoves = useCallback((currentGrid: Gem[]) => {
    // 创建网格的深拷贝，避免修改原始网格
    const gridCopy = currentGrid.map(gem => ({ ...gem }));
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // 检查右侧宝石
        if (col < GRID_SIZE - 1) {
          // 交换宝石
          const index1 = row * GRID_SIZE + col;
          const index2 = row * GRID_SIZE + col + 1;
          const temp = { ...gridCopy[index1] };
          
          // 更新宝石位置
          gridCopy[index1] = {
            ...gridCopy[index2],
            row: row,
            col: col
          };
          gridCopy[index2] = {
            ...temp,
            row: row,
            col: col + 1
          };
          
          // 检查是否有匹配
          if (findMatches(gridCopy).length > 0) {
            return true;
          }
          
          // 交换回来
          gridCopy[index1] = {
            ...temp,
            row: row,
            col: col
          };
          gridCopy[index2] = {
            ...gridCopy[index2],
            row: row,
            col: col + 1
          };
        }
        
        // 检查下方宝石
        if (row < GRID_SIZE - 1) {
          // 交换宝石
          const index1 = row * GRID_SIZE + col;
          const index2 = (row + 1) * GRID_SIZE + col;
          const temp = { ...gridCopy[index1] };
          
          // 更新宝石位置
          gridCopy[index1] = {
            ...gridCopy[index2],
            row: row,
            col: col
          };
          gridCopy[index2] = {
            ...temp,
            row: row + 1,
            col: col
          };
          
          // 检查是否有匹配
          if (findMatches(gridCopy).length > 0) {
            return true;
          }
          
          // 交换回来
          gridCopy[index1] = {
            ...temp,
            row: row,
            col: col
          };
          gridCopy[index2] = {
            ...gridCopy[index2],
            row: row + 1,
            col: col
          };
        }
      }
    }
    return false;
  }, [findMatches]);

  // 检查匹配并处理
  const checkMatches = useCallback(() => {
    if (isAnimating) return;
    
    setGrid(prevGrid => {
      const matches = findMatches(prevGrid);
      if (matches.length > 0) {
        setIsAnimating(true);
        
        // 标记匹配的宝石
        const gridWithMatched = prevGrid.map(gem => {
          const isMatched = matches.some(match => 
            match.some(m => m.id === gem.id)
          );
          return isMatched ? { ...gem, isMatched: true } : gem;
        });
        
        // 清除之前的动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        setTimeout(() => {
          setGrid(innerPrevGrid => {
            let newGrid = [...innerPrevGrid];
            
            // 移除匹配的宝石
            newGrid = newGrid.map(gem => {
              if (gem.isMatched) {
                return {
                  ...gem,
                  type: '',
                  isMatched: true
                };
              }
              return gem;
            });
            
            // 应用重力
            newGrid = applyGravity(newGrid);
            
            // 计算实际匹配的宝石数量
            const matchedGemCount = matches.reduce((count, match) => count + match.length, 0);
            const points = matchedGemCount * 10;
            
            setScore(prev => {
              const newScore = prev + points;
              setHighScore(prevHigh => Math.max(prevHigh, newScore));
              
              // 检查是否升级
              if (newScore >= targetScore) {
                setLevel(prevLevel => prevLevel + 1);
                setTargetScore(prevTarget => prevTarget + 1500);
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 2000);
              }
              
              return newScore;
            });
            
            // 递归检查是否有新的匹配
            setTimeout(() => {
              setIsAnimating(false);
              // 在下一个动画帧检查，确保所有状态更新完成
              animationFrameRef.current = requestAnimationFrame(() => {
                checkMatches();
              });
            }, 300);
            
            return newGrid;
          });
        }, 500);
        
        return gridWithMatched;
      } else {
        // 检查是否有可移动的宝石
        if (!checkMoves(prevGrid)) {
          // 延迟设置游戏结束，确保所有动画完成
          setTimeout(() => {
            setGameOver(true);
          }, 500);
        }
        return prevGrid;
      }
    });
  }, [findMatches, applyGravity, targetScore, checkMoves, isAnimating]);

  // 检查相邻宝石
  const areAdjacent = useCallback((gem1: Gem, gem2: Gem) => {
    const rowDiff = Math.abs(gem1.row - gem2.row);
    const colDiff = Math.abs(gem1.col - gem2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []);

  // 交换宝石
  const swapGems = useCallback((gem1: Gem, gem2: Gem) => {
    if (isAnimating || gameOver) return;

    const index1 = gem1.row * GRID_SIZE + gem1.col;
    const index2 = gem2.row * GRID_SIZE + gem2.col;
    
    // 确保宝石存在且类型不为空
    if (!gem1.type || !gem2.type) return;
    
    setGrid(prevGrid => {
      // 先创建交换后的网格
      const tempGrid = [...prevGrid];
      tempGrid[index1] = {
        ...gem2,
        id: index1,
        row: gem1.row,
        col: gem1.col,
        isSelected: false
      };
      tempGrid[index2] = {
        ...gem1,
        id: index2,
        row: gem2.row,
        col: gem2.col,
        isSelected: false
      };
      
      // 检查交换后是否形成匹配
      const matches = findMatches(tempGrid);
      
      if (matches.length > 0) {
        // 有匹配，执行交换
        setMoves(prev => prev + 1);
        setSelectedGem(null);
        
        // 检查匹配
        setTimeout(() => {
          checkMatches();
        }, 100);
        
        return tempGrid;
      } else {
        // 没有匹配，不执行交换
        setSelectedGem(null);
        return prevGrid;
      }
    });
  }, [isAnimating, gameOver, checkMatches, findMatches]);

  // 处理宝石点击
  const handleGemClick = useCallback((gem: Gem) => {
    if (isAnimating || gem.isMatched || gameOver || !gem.type) return;

    if (selectedGem) {
      if (selectedGem.id === gem.id) {
        // 取消选择
        setSelectedGem(null);
      } else if (areAdjacent(selectedGem, gem) && selectedGem.type) {
        // 交换相邻宝石，确保两个宝石都有类型
        swapGems(selectedGem, gem);
      } else {
        // 选择新的宝石
        setSelectedGem(gem);
      }
    } else {
      // 选择第一个宝石
      setSelectedGem(gem);
    }
  }, [selectedGem, isAnimating, gameOver, areAdjacent, swapGems]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 渲染游戏
  const renderGame = () => {
    return (
      <div
        className="match3-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '8px',
          maxWidth: '500px',
          margin: '2rem auto',
          padding: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(106, 90, 205, 0.5)'
        }}
      >
        {grid.map(gem => (
          <div
            key={gem.id}
            className={`match3-gem ${selectedGem?.id === gem.id ? 'selected' : ''} ${gem.isMatched ? 'matched' : ''}`}
            onClick={() => handleGemClick(gem)}
            style={{
              aspectRatio: '1',
              cursor: isAnimating || gem.isMatched || gameOver ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: gem.isMatched ? 0.5 : 1,
              transform: gem.isMatched ? 'scale(0)' : 'scale(1)',
              position: 'relative'
            }}
          >
            <div
              className="gem-inner"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                backgroundColor: selectedGem?.id === gem.id ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                borderRadius: '12px',
                boxShadow: selectedGem?.id === gem.id ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 2px 4px rgba(0, 0, 0, 0.3)',
                transform: gem.isMatched ? 'scale(0)' : 'scale(1)',
                transition: 'transform 0.3s ease, box-shadow 0.2s ease',
                animation: gem.row === 0 ? 'gemDrop 0.5s ease-out' : 'none'
              }}
            >
              {gem.type}
            </div>
          </div>
        ))}
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
            消消乐
          </h1>
        </div>
        <div className="game-stats" style={{
          display: 'flex',
          gap: '20px',
          color: '#ffffff'
        }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>分数</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{score}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>最高分</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{highScore}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>关卡</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{level}</span>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>移动</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{moves}</span>
          </div>
        </div>
      </div>

      {/* 目标分数条 */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '5px',
          color: '#ffffff'
        }}>
          <span>目标分数: {targetScore}</span>
          <span>当前: {score}</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min((score / targetScore) * 100, 100)}%`,
            height: '100%',
            backgroundColor: '#00ffcc',
            borderRadius: '5px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {renderGame()}

      <div className="control-buttons" style={{
        marginTop: '30px',
        display: 'flex',
        gap: '20px'
      }}>
        <button 
          className="control-btn"
          onClick={initGame}
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
          🔄
        </button>
      </div>

      {/* 关卡升级提示 */}
      {showLevelUp && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h2 style={{ color: '#00ffcc', fontSize: '36px', marginBottom: '20px' }}>关卡升级！</h2>
          <p style={{ color: '#ffffff', fontSize: '20px' }}>恭喜你升级到关卡 {level}！</p>
        </div>
      )}

      {/* 游戏结束提示 */}
      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(106, 90, 205, 0.8)',
            border: '2px solid #6a5acd',
            textAlign: 'center'
          }}>
            <h2 style={{
              color: '#ff6b6b',
              fontSize: '36px',
              marginBottom: '20px'
            }}>
              游戏结束
            </h2>
            <p style={{
              color: '#ffffff',
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              最终分数: {score}
            </p>
            <p style={{
              color: '#ffffff',
              fontSize: '18px',
              marginBottom: '30px'
            }}>
              关卡: {level} | 移动: {moves}
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button 
                onClick={initGame}
                style={{
                  padding: '12px 24px',
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
                重新开始
              </button>
              <button 
                onClick={onBack}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#444'}
              >
                返回主菜单
              </button>
            </div>
          </div>
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
        <p>1. 点击选择一个宝石，然后点击相邻的宝石进行交换</p>
        <p>2. 三个或更多相同宝石连成一线会消除并得分</p>
        <p>3. 每次消除一个宝石得10分</p>
        <p>4. 消除后上方的宝石会下落填补空位</p>
        <p>5. 空位会生成新的宝石</p>
        <p>6. 达到目标分数升级关卡，难度会逐渐提高</p>
      </div>
    </div>
  );
}

export default Match3Game;