import React, { useState, useEffect, useCallback } from 'react';

// 游戏配置
const GRID_SIZE = 4;
const CARD_COUNT = GRID_SIZE * GRID_SIZE;
const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍍', '🥝'];

// 卡片类型
type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

interface MemoryGameProps {
  onBack: () => void;
}

function MemoryGame({ onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // 初始化游戏
  const initGame = useCallback(() => {
    // 确保每种emoji只出现两次
    const pairedEmojis = [];
    // 明确生成8对emoji
    const requiredPairs = 8;
    for (let i = 0; i < requiredPairs; i++) {
      const emoji = EMOJIS[i % EMOJIS.length];
      pairedEmojis.push(emoji);
      pairedEmojis.push(emoji);
    }
    const shuffledEmojis = pairedEmojis.sort(() => Math.random() - 0.5);
    
    const gameCards: Card[] = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      gameCards.push({
        id: i,
        emoji: shuffledEmojis[i],
        isFlipped: false,
        isMatched: false
      });
    }

    setCards(gameCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setIsGameOver(false);
  }, []);

  // 处理卡片点击
  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length === 2 || isFlipping || cards[cardId].isFlipped || cards[cardId].isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prevCards => prevCards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlippedCards.length === 2) {
      setIsFlipping(true);
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      
      setCards(prevCards => {
        const firstCard = prevCards.find(card => card.id === firstId);
        const secondCard = prevCards.find(card => card.id === secondId);
        
        if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
          setTimeout(() => {
            setCards(innerPrevCards => innerPrevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isMatched: true } 
                : card
            ));
            setFlippedCards([]);
            setIsFlipping(false);
            
            setMatchedPairs(prev => {
              const newMatchedPairs = prev + 1;
              // 明确检查是否达到16对
              if (newMatchedPairs === 16) {
                setIsGameOver(true);
                setBestScore(innerPrev => innerPrev === 0 ? moves : Math.min(innerPrev, moves));
              }
              return newMatchedPairs;
            });
          }, 500);
        } else {
          setTimeout(() => {
            setCards(innerPrevCards => innerPrevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isFlipped: false } 
                : card
            ));
            setFlippedCards([]);
            setIsFlipping(false);
          }, 1000);
        }
        return prevCards;
      });
    }
  }, [flippedCards, cards, moves]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-container">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <h1 className="game-title">记忆翻牌</h1>
        </div>
        <div className="game-stats">
          <div className="stat-item">
            <span>步数</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat-item">
            <span>最佳成绩</span>
            <span className="stat-value">{bestScore}</span>
          </div>
          <div className="stat-item">
            <span>配对</span>
            <span className="stat-value">{matchedPairs}/{CARD_COUNT}</span>
          </div>
        </div>
      </div>

      <div 
        className="memory-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '1rem',
          maxWidth: '600px',
          margin: '2rem auto'
        }}
      >
        {cards.map(card => (
          <div
          key={card.id}
          className="memory-card"
          onClick={() => handleCardClick(card.id)}
          style={{
            aspectRatio: '1',
            perspective: '1000px',
            cursor: 'pointer',
            minWidth: '80px',
            minHeight: '80px'
          }}
        >
            <div
              className={`memory-card-inner ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s',
                ...(card.isMatched && {
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                  animation: 'glow 1.5s ease-in-out infinite alternate'
                })
              }}
            >
              <div
                className="memory-card-front"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#6a5acd',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  transform: 'rotateY(180deg)'
                }}
              >
                {card.emoji}
              </div>
              <div
                className="memory-card-back"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: '#9370db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="control-buttons">
        <button className="control-btn" onClick={initGame}>🔄</button>
      </div>

      {isGameOver && (
        <div className="game-over">
          <h2>🎉 恭喜完成！</h2>
          <p>总步数: {moves}</p>
          <p>最佳成绩: {bestScore}</p>
          <div>
            <button className="btn btn-primary" onClick={initGame}>再玩一次</button>
            <button className="btn btn-secondary" onClick={onBack}>返回主菜单</button>
          </div>
        </div>
      )}

      <div className="game-info" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
        <p>点击卡片翻面，找到所有配对的emoji</p>
        <p>尽量用最少的步数完成游戏</p>
      </div>
    </div>
  );
}

export default MemoryGame;