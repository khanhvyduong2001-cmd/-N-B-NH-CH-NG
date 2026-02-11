import React from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, score, onStart, onRestart }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-6">
      
      {/* Top Bar: Score */}
      <div className="flex justify-between items-start w-full">
         <div className="bg-red-600 border-4 border-yellow-400 rounded-full px-6 py-2 shadow-lg transform rotate-1">
            <h2 className="text-3xl font-bold text-yellow-300 drop-shadow-md">
              Điểm: {score}
            </h2>
         </div>
      </div>

      {/* Center States */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        
        {/* Loading */}
        {gameState === GameState.LOADING && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl text-center border-4 border-red-500 animate-pulse">
             <p className="text-2xl text-red-600 font-bold">📷 Đang khởi động Camera...</p>
             <p className="text-sm text-gray-600 mt-2">(Vui lòng cho phép truy cập Webcam)</p>
          </div>
        )}

        {/* Ready */}
        {gameState === GameState.READY && (
           <div className="text-center animate-bounce">
              <h1 className="text-6xl text-yellow-400 font-extrabold drop-shadow-[0_5px_5px_rgba(220,38,38,1)] mb-6 stroke-red-800">
                THÁNH ĂN<br/>BÁNH CHƯNG
              </h1>
              <button 
                onClick={onStart}
                className="bg-red-600 hover:bg-red-700 text-yellow-300 text-3xl font-bold py-4 px-10 rounded-full border-4 border-yellow-400 shadow-xl transition-transform hover:scale-110 active:scale-95"
              >
                BẮT ĐẦU CHƠI ▶
              </button>
              <p className="mt-4 text-white text-xl font-bold bg-black/30 p-2 rounded-lg">
                Mở miệng to để ăn bánh!<br/>Ăn càng nhiều, má càng phính!
              </p>
           </div>
        )}

        {/* Game Over */}
        {gameState === GameState.GAME_OVER && (
          <div className="bg-red-600/90 p-10 rounded-3xl border-8 border-yellow-400 text-center shadow-2xl max-w-lg">
             <h2 className="text-5xl font-extrabold text-yellow-300 mb-2">CHÚC MỪNG NĂM MỚI</h2>
             <h3 className="text-6xl font-black text-white mb-6 tracking-wider">BÉO TỐT!</h3>
             
             <div className="mb-8">
               <p className="text-2xl text-yellow-100">Bạn đã ăn được:</p>
               <p className="text-6xl font-bold text-yellow-300 mt-2">{score} cái</p>
             </div>

             <button 
                onClick={onRestart}
                className="bg-yellow-400 hover:bg-yellow-300 text-red-700 text-2xl font-bold py-3 px-8 rounded-full border-4 border-white shadow-lg transition-transform hover:scale-105"
              >
                CHƠI LẠI (GIẢM CÂN) ↺
              </button>
          </div>
        )}
      </div>

      {/* Footer / Credits */}
      <div className="text-center opacity-60">
        <p className="text-white text-sm font-semibold shadow-black drop-shadow-md">Tết Nguyên Đán AR Game</p>
      </div>
    </div>
  );
};

export default UIOverlay;
