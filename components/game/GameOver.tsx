// components/game/GameOver.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameOverProps {
  outcome: 'win' | 'loss';
  monthsSurvived: number;
  highestCash: number;
  cardsPlayed: number;
  industryName: string;
  industryIcon?: string;
  playTimeMinutes: number;
  playerName: string;
  newRecord: { months: boolean, cash: boolean, cards: boolean };
  onShare: () => void;
  shareMessage: string;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOver({
  outcome,
  monthsSurvived,
  highestCash,
  cardsPlayed,
  industryName,
  industryIcon,
  playTimeMinutes,
  playerName,
  newRecord,
  onShare,
  shareMessage,
  onRestart,
  onMainMenu,
}: GameOverProps) {
  const isWin = outcome === 'win';
  const emoji = isWin ? '🏆' : '💀';
  const headline = isWin ? 'You Win!' : 'Game Over';
  const subMessage = isWin
    ? `Congratulations, ${playerName}! You've built a thriving business.`
    : `Sorry, ${playerName}! Your business has gone bankrupt.`;
  const tip = isWin
    ? 'Can you do it even faster next time?'
    : 'Tip: Try to keep your expenses below your revenue!';
  const playTime = playTimeMinutes < 1
    ? `${Math.round(playTimeMinutes * 60)}s`
    : `${Math.round(playTimeMinutes)}m`;
  const [showCopied, setShowCopied] = useState(false);

  const handleShareClick = () => {
    onShare();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/95 rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-indigo-500/40 max-w-md mx-auto mt-16 relative">
      {/* Username prominently at the top */}
      <div className="flex flex-col items-center mb-2">
        <span className="text-lg font-semibold text-indigo-300 tracking-wide mb-1">Player:</span>
        <span className="text-2xl font-bold text-white mb-2">{playerName}</span>
      </div>
      {/* Confetti or New Record badge */}
      <AnimatePresence>
        {(newRecord.months || newRecord.cash || newRecord.cards) && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full font-bold shadow-lg text-lg flex items-center gap-2 z-10"
          >
            🎉 New Record!
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-4">
          <span className="text-6xl mb-2">{emoji}</span>
          <h2 className={`text-3xl font-bold text-center mb-1 ${isWin ? 'text-indigo-300' : 'text-red-400'}`}>{headline}</h2>
          <p className="text-center text-slate-300 mb-2">{subMessage}</p>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 gap-2 text-base">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="text-slate-300">Months survived:</span>
              <span className="font-bold text-sky-300 ml-auto">{monthsSurvived}</span>
              {newRecord.months && <span className="ml-2 text-amber-400 font-bold">★</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="text-slate-300">Highest cash:</span>
              <span className="font-bold text-amber-300 ml-auto">${highestCash.toLocaleString()}</span>
              {newRecord.cash && <span className="ml-2 text-amber-400 font-bold">★</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🃏</span>
              <span className="text-slate-300">Cards played:</span>
              <span className="font-bold text-indigo-200 ml-auto">{cardsPlayed}</span>
              {newRecord.cards && <span className="ml-2 text-amber-400 font-bold">★</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{industryIcon || '🏭'}</span>
              <span className="text-slate-300">Industry:</span>
              <span className="font-bold text-white ml-auto">{industryName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <span className="text-slate-300">Play time:</span>
              <span className="font-bold text-white ml-auto">{playTime}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/60 p-3 rounded-lg mb-6 border border-slate-600 text-center">
          <span className={`font-medium ${isWin ? 'text-indigo-300' : 'text-red-300'}`}>{tip}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <motion.button
            onClick={onRestart}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
          <motion.button
            onClick={onMainMenu}
            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Main Menu
          </motion.button>
          <motion.button
            onClick={handleShareClick}
            className="flex-1 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold rounded-lg shadow-md transition-all duration-200 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showCopied ? 'Copied!' : 'Share'}
            <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs text-slate-300 whitespace-nowrap pointer-events-none select-none">
              {showCopied ? 'Share message copied!' : 'Share your result!'}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}