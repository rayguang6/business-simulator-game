// components/game/MonthSummary.jsx
import { motion } from 'framer-motion';

export default function MonthSummary({ summary, onClose }) {
  if (!summary) return null;
  
  const isProfit = summary.profit >= 0;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div className="bg-slate-700 rounded-xl shadow-lg p-6 border border-indigo-500/50">
      <h2 className="text-2xl font-bold text-center mb-2 text-white">Monthly Report</h2>
      <p className="text-center text-slate-400 mb-6">{monthNames[summary.month - 1]} {summary.year}</p>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600">
          <span className="font-medium flex items-center text-green-400">
            <span className="mr-2">📈</span>
            Revenue
          </span>
          <span className="text-xl font-semibold text-white">${summary.revenue.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600">
          <span className="font-medium flex items-center text-red-400">
            <span className="mr-2">📉</span>
            Expenses
          </span>
          <span className="text-xl font-semibold text-white">${summary.expenses.toLocaleString()}</span>
        </div>
        
        <motion.div 
          className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="font-semibold text-white">Net Profit</span>
          <span className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}${summary.profit.toLocaleString()}
          </span>
        </motion.div>
        
        <motion.div 
          className="flex justify-between items-center p-4 bg-indigo-900/30 rounded-lg mt-4 border border-indigo-600/50"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span className="font-semibold text-white">Cash Balance</span>
          <span className="text-2xl font-bold text-white">${summary.cash.toLocaleString()}</span>
        </motion.div>
      </div>
      
      <div className="mt-8 text-center">
        <motion.button
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue to Next Month
        </motion.button>
      </div>
    </div>
  );
}