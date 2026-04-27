import React, { useState } from 'react';
import SnakeGame from './games/SnakeGame';
import TetrisGame from './games/TetrisGame';
import BreakoutGame from './games/BreakoutGame';
import FlappyBirdGame from './games/FlappyBirdGame';
import MemoryGame from './games/MemoryGame';
import Game2048 from './games/Game2048';
import Match3Game from './games/Match3Game';
import LinkGame from './games/LinkGame';
import SpaceShooterGame from './games/SpaceShooterGame';
import GomokuGame from './games/GomokuGame';
import MinesweeperGame from './games/MinesweeperGame';
import SudokuGame from './games/SudokuGame';
import HuaRongDaoGame from './games/HuaRongDaoGame';
import LightsOutGame from './games/LightsOutGame';
import PongGame from './games/PongGame';
import TicTacToeGame from './games/TicTacToeGame';
import MazeGame from './games/MazeGame';
import ColorMemoryGame from './games/ColorMemoryGame';

// 游戏类型
type GameType = 'snake' | 'tetris' | 'breakout' | 'flappy' | 'memory' | 'game2048' | 'match3' | 'link' | 'spaceshooter' | 'gomoku' | 'minesweeper' | 'sudoku' | 'huarongdao' | 'lightsout' | 'pong' | 'tictactoe' | 'maze' | 'colormemory' | null;

function App() {
  const [currentGame, setCurrentGame] = useState<GameType>(null);

  // 游戏列表
  const games = [
    {
      id: 'snake',
      name: '贪吃蛇',
      description: '经典的贪吃蛇游戏，控制蛇吃食物长大',
      icon: '🐍',
    },
    {
      id: 'tetris',
      name: '俄罗斯方块',
      description: '经典的俄罗斯方块游戏，堆叠方块消除行',
      icon: '📦',
    },
    {
      id: 'breakout',
      name: '打砖块',
      description: '控制 paddle 反弹球，打破所有砖块',
      icon: '🏐',
    },
    {
      id: 'flappy',
      name: '像素鸟',
      description: '经典的像素鸟游戏，控制小鸟躲避管道',
      icon: '🐦',
    },
    {
      id: 'memory',
      name: '记忆翻牌',
      description: '经典的记忆游戏，翻开卡片寻找配对',
      icon: '🃏',
    },
    {
      id: 'game2048',
      name: '2048',
      description: '经典的数字拼图游戏，合并方块达到2048',
      icon: '🔢',
    },
    {
      id: 'match3',
      name: '消消乐',
      description: '经典的三消游戏，交换宝石消除得分',
      icon: '💎',
    },
    {
      id: 'link',
      name: '连连看',
      description: '经典的连连看游戏，连接相同图案消除',
      icon: '🔗',
    },
    {
      id: 'spaceshooter',
      name: '飞机射击',
      description: '经典射击游戏，击落敌人获得分数',
      icon: '🚀',
    },
    {
      id: 'gomoku',
      name: '五子棋',
      description: '经典的五子棋游戏，先形成五连子获胜',
      icon: '⚫',
    },
    {
      id: 'minesweeper',
      name: '扫雷',
      description: '经典的扫雷游戏，找出所有非地雷格子',
      icon: '💣',
    },
    {
      id: 'sudoku',
      name: '数独',
      description: '经典的数独益智游戏，挑战你的逻辑思维',
      icon: '📝',
    },
    {
      id: 'huarongdao',
      name: '华容道',
      description: '经典益智游戏，移动方块救出曹操',
      icon: '🧩',
    },
    {
      id: 'lightsout',
      name: '点灯游戏',
      description: '经典益智游戏，关闭所有灯来获胜',
      icon: '💡',
    },
    {
      id: 'pong',
      name: '乒乓游戏',
      description: '经典的乒乓球游戏，击败AI获得胜利',
      icon: '🏓',
    },
    {
      id: 'tictactoe',
      name: '井字棋',
      description: '经典的井字棋游戏，支持双人对战和人机对战',
      icon: '❌⭕',
    },
    {
      id: 'maze',
      name: '迷宫游戏',
      description: '挑战各种难度的迷宫，锻炼方向感',
      icon: '🧩',
    },
    {
      id: 'colormemory',
      name: '色彩记忆',
      description: '考验记忆力的色彩序列游戏',
      icon: '🎨',
    },
  ];

  // 渲染游戏选择页面
  const renderGameSelection = () => (
    <div className="game-selection">
      <h1 className="site-title">🖐️🐟️Let's Go
      </h1>
      <p className="site-description">选择一个游戏开始玩</p>
      <div className="game-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => setCurrentGame(game.id as GameType)}
          >
            <div className="game-icon">{game.icon}</div>
            <h2 className="game-name">{game.name}</h2>
            <p className="game-description">{game.description}</p>
            <button className="play-btn">开始游戏</button>
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染当前游戏
  const renderCurrentGame = () => {
    switch (currentGame) {
      case 'snake':
        return <SnakeGame onBack={() => setCurrentGame(null)} />;
      case 'tetris':
        return <TetrisGame onBack={() => setCurrentGame(null)} />;
      case 'breakout':
        return <BreakoutGame onBack={() => setCurrentGame(null)} />;
      case 'flappy':
        return <FlappyBirdGame onBack={() => setCurrentGame(null)} />;
      case 'memory':
        return <MemoryGame onBack={() => setCurrentGame(null)} />;
      case 'game2048':
        return <Game2048 onBack={() => setCurrentGame(null)} />;
      case 'match3':
        return <Match3Game onBack={() => setCurrentGame(null)} />;
      case 'link':
        return <LinkGame onBack={() => setCurrentGame(null)} />;
      case 'spaceshooter':
        return <SpaceShooterGame onBack={() => setCurrentGame(null)} />;
      case 'gomoku':
        return <GomokuGame onBack={() => setCurrentGame(null)} />;
      case 'minesweeper':
        return <MinesweeperGame onBack={() => setCurrentGame(null)} />;
      case 'sudoku':
        return <SudokuGame onBack={() => setCurrentGame(null)} />;
      case 'huarongdao':
        return <HuaRongDaoGame onBack={() => setCurrentGame(null)} />;
      case 'lightsout':
        return <LightsOutGame onBack={() => setCurrentGame(null)} />;
      case 'pong':
        return <PongGame onBack={() => setCurrentGame(null)} />;
      case 'tictactoe':
        return <TicTacToeGame onBack={() => setCurrentGame(null)} />;
      case 'maze':
        return <MazeGame onBack={() => setCurrentGame(null)} />;
      case 'colormemory':
        return <ColorMemoryGame onBack={() => setCurrentGame(null)} />;
      default:
        return renderGameSelection();
    }
  };

  return (
    <div className="app-container">
      {renderCurrentGame()}
    </div>
  );
}

export default App;