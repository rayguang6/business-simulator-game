// components/game/GameOver.jsx
import { motion } from 'framer-motion';

export default function GameOver({ stats, onRestart }) {
  return (
    <div className="bg-slate-700 rounded-xl shadow-lg p-6 border-2 border-red-500/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-red-400">Game Over</h2>
        <p className="text-center text-slate-300 mb-6">Your business has gone bankrupt!</p>
        
        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-600">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">You survived</div>
            <div className="text-3xl font-bold text-white">{stats.month} months</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Final Cash</div>
              <div className="text-xl font-bold text-red-400">${stats.cash.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Monthly Loss</div>
              <div className="text-xl font-bold text-white">${(stats.expenses - stats.revenue).toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-900/30 p-4 rounded-lg mb-6 border border-red-900/50">
          <h3 className="font-medium mb-2 text-red-400">What went wrong?</h3>
          <p className="text-slate-300">
            Your expenses exceeded your revenue, leading to negative cash flow. In business, 
            maintaining positive cash flow is essential for survival.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <motion.button
            onClick={onRestart}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}