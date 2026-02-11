import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [score, setScore] = useState(0);
  const [fatFactor, setFatFactor] = useState(1.0); // 1.0 = Normal, 2.0 = Max Fat

  const handleStartGame = useCallback(() => {
    setScore(0);
    setFatFactor(1.0);
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAME_OVER);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setFatFactor(1.0);
    setGameState(GameState.PLAYING);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Background decorations (visible if camera fails or loads slow) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 pointer-events-none"></div>
      
      {/* The Game Engine */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        score={score}
        setScore={setScore}
        fatFactor={fatFactor}
        setFatFactor={setFatFactor}
        onGameEnd={handleGameOver}
      />

      {/* The User Interface */}
      <UIOverlay 
        gameState={gameState}
        score={score}
        onStart={handleStartGame}
        onRestart={handleRestart}
      />
    </div>
  );
}

export default App;
