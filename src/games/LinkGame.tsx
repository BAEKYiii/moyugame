import React, { useState, useEffect, useCallback } from 'react';

// 游戏配置
const GRID_SIZE = 8;
const TILE_TYPES = ['💎', '🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🍎', '🍌', '🍒', '🍇', '🍉'];

// 方块类型
type Tile = {
  id: number;
  type: string;
  row: number;
  col: number;
  isSelected: boolean;
  isMatched: boolean;
};

interface LinkGameProps {
  onBack: () => void;
}

function LinkGame({ onBack }: LinkGameProps) {
  const [grid, setGrid] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // 生成随机方块
  const generateTiles = useCallback(() => {
    // 计算需要的图案数量
    const totalTiles = GRID_SIZE * GRID_SIZE;
    const pairsNeeded = totalTiles / 2;
    
    // 选择要使用的图案
    const selectedTypes: string[] = [];
    for (let i = 0; i < pairsNeeded; i++) {
      selectedTypes.push(TILE_TYPES[i % TILE_TYPES.length]);
    }
    
    // 每个图案出现两次
    const tileTypes = [...selectedTypes, ...selectedTypes];
    
    // 打乱顺序
    const shuffledTypes = tileTypes.sort(() => Math.random() - 0.5);

    const newGrid: Tile[] = [];
    let tileId = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid.push({
          id: tileId++,
          type: shuffledTypes[row * GRID_SIZE + col],
          row,
          col,
          isSelected: false,
          isMatched: false
        });
      }
    }
    return newGrid;
  }, []);

  // 初始化游戏
  const initGame = useCallback(() => {
    const newGrid = generateTiles();
    setGrid(newGrid);
    setSelectedTiles([]);
    setScore(0);
    setMoves(0);
    setIsAnimating(false);
    setGameWon(false);
  }, [generateTiles]);

  // 检查两个点之间的直线路径是否通畅
  const isPathClear = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    // 确保是直线
    if (r1 !== r2 && c1 !== c2) return false;
    
    // 同一行
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      for (let c = minCol + 1; c < maxCol; c++) {
        const tile = grid.find(t => t.row === r1 && t.col === c);
        if (tile && !tile.isMatched) {
          return false;
        }
      }
      return true;
    }
    
    // 同一列
    if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      for (let r = minRow + 1; r < maxRow; r++) {
        const tile = grid.find(t => t.row === r && t.col === c1);
        if (tile && !tile.isMatched) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }, [grid]);

  // 检查两个方块是否可以直线连接
  const canConnectDirectly = useCallback((tile1: Tile, tile2: Tile) => {
    return isPathClear(tile1.row, tile1.col, tile2.row, tile2.col);
  }, [isPathClear]);

  // 检查两个方块是否可以通过一个拐点连接
  const canConnectWithOneTurn = useCallback((tile1: Tile, tile2: Tile) => {
    const { row: r1, col: c1 } = tile1;
    const { row: r2, col: c2 } = tile2;

    // 确保不是斜线
    if (r1 !== r2 && c1 !== c2) {
      // 第一个拐点：(r1, c2)
      if (isPathClear(r1, c1, r1, c2) && isPathClear(r1, c2, r2, c2)) {
        return true;
      }

      // 第二个拐点：(r2, c1)
      if (isPathClear(r1, c1, r2, c1) && isPathClear(r2, c1, r2, c2)) {
        return true;
      }
    }

    return false;
  }, [isPathClear]);

  // 检查两个方块是否可以通过两个拐点连接
  const canConnectWithTwoTurns = useCallback((tile1: Tile, tile2: Tile) => {
    const { row: r1, col: c1 } = tile1;
    const { row: r2, col: c2 } = tile2;

    // 检查左侧边界路径
    if (isPathClear(r1, c1, r1, -1) && isPathClear(r1, -1, r2, -1) && isPathClear(r2, -1, r2, c2)) {
      return true;
    }

    // 检查右侧边界路径
    if (isPathClear(r1, c1, r1, GRID_SIZE) && isPathClear(r1, GRID_SIZE, r2, GRID_SIZE) && isPathClear(r2, GRID_SIZE, r2, c2)) {
      return true;
    }

    // 检查顶部边界路径
    if (isPathClear(r1, c1, -1, c1) && isPathClear(-1, c1, -1, c2) && isPathClear(-1, c2, r2, c2)) {
      return true;
    }

    // 检查底部边界路径
    if (isPathClear(r1, c1, GRID_SIZE, c1) && isPathClear(GRID_SIZE, c1, GRID_SIZE, c2) && isPathClear(GRID_SIZE, c2, r2, c2)) {
      return true;
    }

    return false;
  }, [isPathClear]);

  // 检查两个方块是否可以连接
  const canConnect = useCallback((tile1: Tile, tile2: Tile) => {
    // 检查是否是相同类型
    if (tile1.type !== tile2.type) return false;
    // 检查是否已经匹配
    if (tile1.isMatched || tile2.isMatched) return false;
    // 检查是否是同一个方块
    if (tile1.id === tile2.id) return false;

    // 直线连接
    if (canConnectDirectly(tile1, tile2)) return true;
    // 一个拐点连接
    if (canConnectWithOneTurn(tile1, tile2)) return true;
    // 两个拐点连接
    if (canConnectWithTwoTurns(tile1, tile2)) return true;

    return false;
  }, [canConnectDirectly, canConnectWithOneTurn, canConnectWithTwoTurns]);

  // 处理方块点击
  const handleTileClick = useCallback((tile: Tile) => {
    if (isAnimating || tile.isMatched) return;

    const isAlreadySelected = selectedTiles.some(t => t.id === tile.id);

    if (isAlreadySelected) {
      // 取消选中
      setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
    } else if (selectedTiles.length < 2) {
      // 选中新方块
      setSelectedTiles(prev => [...prev, tile]);
    } else {
      // 已经选中了两个方块，先清空选择，再选中新方块
      setSelectedTiles([tile]);
    }
  }, [selectedTiles, isAnimating]);

  // 处理选择变化
  useEffect(() => {
    if (selectedTiles.length === 2) {
      setIsAnimating(true);
      setMoves(prev => prev + 1);

      const [tile1, tile2] = selectedTiles;
      if (canConnect(tile1, tile2)) {
        // 匹配成功
        setTimeout(() => {
          setGrid(prevGrid => prevGrid.map(tile => {
            if (tile.id === tile1.id || tile.id === tile2.id) {
              return { ...tile, isMatched: true, isSelected: false };
            }
            return tile;
          }));
          setScore(prev => {
            const newScore = prev + 10;
            setHighScore(prevHigh => Math.max(prevHigh, newScore));
            return newScore;
          });
          setSelectedTiles([]);
          setIsAnimating(false);
        }, 500);
      } else {
        // 匹配失败
        setTimeout(() => {
          setGrid(prevGrid => prevGrid.map(tile => {
            if (tile.id === tile1.id || tile.id === tile2.id) {
              return { ...tile, isSelected: false };
            }
            return tile;
          }));
          setSelectedTiles([]);
          setIsAnimating(false);
        }, 500);
      }
    }
  }, [selectedTiles, canConnect]);

  // 检查游戏是否胜利
  useEffect(() => {
    if (grid.length > 0) {
      const allMatched = grid.every(tile => tile.isMatched);
      if (allMatched) {
        setGameWon(true);
      }
    }
  }, [grid]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 渲染游戏
  const renderGame = () => {
    return (
      <div
        className="link-grid"
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
        {grid.map(tile => (
          <div
            key={tile.id}
            className={`link-tile ${tile.isSelected ? 'selected' : ''} ${tile.isMatched ? 'matched' : ''}`}
            onClick={() => handleTileClick(tile)}
            style={{
              aspectRatio: '1',
              cursor: isAnimating || tile.isMatched ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: tile.isMatched ? 0.5 : 1,
              transform: tile.isMatched ? 'scale(0.8)' : 'scale(1)',
              position: 'relative'
            }}
          >
            <div
              className="tile-inner"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                backgroundColor: tile.isSelected ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                borderRadius: '12px',
                boxShadow: tile.isSelected ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 2px 4px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.2s ease',
                transform: tile.isMatched ? 'scale(0.8)' : 'scale(1)'
              }}
            >
              {tile.type}
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
            连连看
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
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.8 }}>移动</span>
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{moves}</span>
          </div>
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

      {/* 游戏胜利提示 */}
      {gameWon && (
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
              color: '#00ffcc',
              fontSize: '36px',
              marginBottom: '20px'
            }}>
              恭喜获胜！
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
              移动次数: {moves}
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
        <p>1. 点击选择两个相同的图案</p>
        <p>2. 如果两个图案之间的道路是通畅的（只能通过直线和折线连接），则消除这两个图案</p>
        <p>3. 每次消除一对图案得10分</p>
        <p>4. 消除所有图案后游戏胜利</p>
        <p>5. 尝试用最少的移动次数完成游戏</p>
      </div>
    </div>
  );
}

export default LinkGame;