// components/game/PnLReport.tsx
import { motion } from 'framer-motion';

interface PnLReportProps {
  gameState: GameState;
  onClose: () => void;
}

export default function PnLReport({ gameState, onClose }: PnLReportProps) {
  const profit = gameState.revenue - gameState.expenses;
  const isProfitable = profit > 0;
  
  // Group history by month
  const historyByMonth = gameState.history.reduce((acc, entry) => {
    const month = entry.month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(entry);
    return acc;
  }, {} as Record<number, any[]>);

  // Array of month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-slate-700 rounded-xl shadow-lg p-4 border-2 border-blue-700/30">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Financial Report</h2>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Current Financials */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Current Financials</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-slate-400">Cash</div>
            <div className="text-lg font-bold text-amber-400">${gameState.cash.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Revenue</div>
            <div className="text-lg font-bold text-emerald-400">${gameState.revenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Expenses</div>
            <div className="text-lg font-bold text-rose-400">${gameState.expenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-300">Monthly Profit</div>
            <div className={`text-lg font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              ${profit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Active Effects */}
      {gameState.temporary_effects && gameState.temporary_effects.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Active Effects</h3>
          <div className="space-y-2">
            {gameState.temporary_effects.map((effect, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md"
              >
                <span className="text-sm text-slate-300 truncate flex-1 mr-2">{effect.name}</span>
                <div className="flex flex-col items-end">
                  {effect.revenue ? (
                    <span className={`text-xs ${effect.revenue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Revenue: {effect.revenue > 0 ? '+' : ''}${effect.revenue}/mo
                    </span>
                  ) : null}
                  
                  {effect.expenses ? (
                    <span className={`text-xs ${effect.expenses < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Expenses: {effect.expenses > 0 ? '+' : ''}${effect.expenses}/mo
                    </span>
                  ) : null}
                  
                  <span className="text-xs text-slate-400">
                    {effect.monthsRemaining} month{effect.monthsRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly History */}
      <div className="bg-slate-800 rounded-lg p-3">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Monthly History</h3>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {Object.keys(historyByMonth)
            .map(Number)
            .sort((a, b) => b - a) // Sort newest to oldest
            .map(month => {
              const monthEntries = historyByMonth[month];
              
              // Calculate monthly totals
              const monthTotals = monthEntries.reduce((totals, entry) => {
                return {
                  cash: totals.cash + (entry.effects.cash || 0),
                  revenue: totals.revenue + (entry.effects.revenue || 0),
                  expenses: totals.expenses + (entry.effects.expenses || 0),
                };
              }, { cash: 0, revenue: 0, expenses: 0 });
              
              return (
                <div key={month} className="pb-2 border-b border-slate-700 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-medium text-blue-300">
                      {monthNames[(month - 1) % 12]} {Math.floor((month - 1) / 12) + 2025}
                    </h4>
                    <div className={`text-xs font-semibold ${monthTotals.cash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {monthTotals.cash > 0 ? '+' : ''}${monthTotals.cash.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Month entries */}
                  <div className="space-y-1">
                    {monthEntries.map((entry, idx) => (
                      <div key={idx} className="text-xs flex justify-between bg-slate-700/30 px-2 py-1 rounded">
                        <span className="text-slate-300 truncate flex-1 mr-2">{entry.choice_label}</span>
                        <span className="flex space-x-2 flex-shrink-0">
                          {entry.effects.cash !== 0 && (
                            <span className={entry.effects.cash > 0 ? 'text-green-400' : 'text-red-400'}>
                              ${entry.effects.cash}
                            </span>
                          )}
                          {entry.effects.revenue !== 0 && (
                            <span className={entry.effects.revenue > 0 ? 'text-green-400' : 'text-red-400'}>
                              Rev: ${entry.effects.revenue}
                            </span>
                          )}
                          {entry.effects.expenses !== 0 && (
                            <span className={entry.effects.expenses < 0 ? 'text-green-400' : 'text-red-400'}>
                              Exp: ${entry.effects.expenses}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Close button */}
      <div className="mt-4 text-center">
        <motion.button
          onClick={onClose}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue Playing
        </motion.button>
      </div>
    </div>
  );
}