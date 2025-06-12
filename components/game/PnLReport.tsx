// components/game/PnLReport.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

interface PnLReportProps {
  gameState: {
    recentDecisions?: Array<{
      month: number;
      cardTitle: string;
      choiceLabel: string;
      effects: any;
    }>;
    year?: number;
  };
  onClose: () => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PnLReport({ gameState, onClose }: PnLReportProps) {
  const { recentDecisions = [], year = 2025 } = gameState;

  // Pagination state
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(recentDecisions.length / PAGE_SIZE);

  // Show newest first
  const orderedDecisions = [...recentDecisions].reverse();
  const paginatedDecisions = orderedDecisions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Get month name from month number
  const getMonthName = (monthNum: number) => monthNames[monthNum % 12];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      onClick={e => e.stopPropagation()}
      className="fixed top-20 sm:top-24 md:top-28 bottom-4 sm:bottom-5 md:bottom-6 left-0 right-0 mx-auto z-[1050] flex flex-col w-[95%] sm:w-[90%] max-w-2xl rounded-lg shadow-xl border-2 overflow-hidden"
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
        borderColor: '#334155', 
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)' 
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-6 pt-4 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">📋 Decision History</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-2xl font-bold px-2 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Content: Simple Decision List */}
      <div className="overflow-y-auto p-4 sm:p-6 flex-grow space-y-4">
        {orderedDecisions.length === 0 ? (
          <div className="text-slate-400 text-center">No decisions made yet.</div>
        ) : (
          <div className="space-y-3">
            {paginatedDecisions.map((decision, index) => (
              <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-xs text-slate-400">
                    {getMonthName(decision.month)} {year + Math.floor(decision.month / 12)}
                  </span>
                  <span className="text-xs text-blue-300">{decision.cardTitle}</span>
                  <span className="text-xs text-slate-300">→ {decision.choiceLabel}</span>
                </div>
                {decision.effects && Object.keys(decision.effects).length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs mt-1">
                    {decision.effects.cash !== undefined && (
                      <span className={`px-2 py-1 rounded-full ${decision.effects.cash > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        Cash: {decision.effects.cash > 0 ? '+' : ''}{formatCurrency(decision.effects.cash)}
                      </span>
                    )}
                    {decision.effects.revenue !== undefined && (
                      <span className={`px-2 py-1 rounded-full ${decision.effects.revenue > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        Revenue: {decision.effects.revenue > 0 ? '+' : ''}{formatCurrency(decision.effects.revenue)}/mo
                      </span>
                    )}
                    {decision.effects.expenses !== undefined && (
                      <span className={`px-2 py-1 rounded-full ${decision.effects.expenses < 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        Expenses: {decision.effects.expenses > 0 ? '+' : ''}{formatCurrency(decision.effects.expenses)}/mo
                      </span>
                    )}
                    {decision.effects.customerRating !== undefined && (
                      <span className={`px-2 py-1 rounded-full ${decision.effects.customerRating > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        Rating: {decision.effects.customerRating > 0 ? '+' : ''}{decision.effects.customerRating} pts
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-slate-300 text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}