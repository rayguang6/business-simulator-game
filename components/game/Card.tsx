// @ts-nocheck
// components/game/Card.jsx
import { motion } from 'framer-motion';

export default function Card({ card, onDecision, disabled }) {
  if (!card) return null;
  
  return (
    <div className="bg-slate-700 rounded-xl overflow-hidden border border-slate-600 shadow-lg">
      <div className={`p-3 text-white text-center ${getCardTypeColor(card.type)}`}>
        <span className="font-medium uppercase tracking-wider text-sm">{card.type}</span>
      </div>
      
      <div className="p-5">
        <h2 className="text-xl font-bold mb-6 text-center text-white">{card.question}</h2>
        
        <div className="space-y-4">
          {card.choices.map((choice, index) => (
            <motion.button
              key={index}
              onClick={() => !disabled && onDecision(choice)}
              className="cursor-pointer w-full text-left p-4 border border-slate-600 rounded-lg hover:border-indigo-400 hover:shadow-lg shadow transition-all duration-200 disabled:opacity-70 bg-slate-800"
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <div className="font-medium text-lg mb-2 text-white">{choice.label}</div>
              <div className="text-slate-300 mb-3">{choice.description}</div>
              
              <div className="flex flex-wrap gap-2">
                {choice.effects.cash !== 0 && (
                  <span className={`px-3 py-0.5 rounded-full text-sm font-medium ${choice.effects.cash > 0 ? 'bg-green-900/70 text-green-400' : 'bg-red-900/70 text-red-400'}`}>
                    Cash: {choice.effects.cash > 0 ? '+' : ''}${choice.effects.cash.toLocaleString()}
                  </span>
                )}
                {choice.effects.revenue !== 0 && (
                  <span className={`px-3 py-0.5 rounded-full text-sm font-medium ${choice.effects.revenue > 0 ? 'bg-green-900/70 text-green-400' : 'bg-red-900/70 text-red-400'}`}>
                    Revenue: {choice.effects.revenue > 0 ? '+' : ''}${choice.effects.revenue.toLocaleString()}/mo
                  </span>
                )}
                {choice.effects.expenses !== 0 && (
                  <span className={`px-3 py-0.5 rounded-full text-sm font-medium ${choice.effects.expenses < 0 ? 'bg-green-900/70 text-green-400' : 'bg-red-900/70 text-red-400'}`}>
                    Expenses: {choice.effects.expenses > 0 ? '+' : ''}${choice.effects.expenses.toLocaleString()}/mo
                  </span>
                )}
                {choice.effects.duration > 1 && (
                  <span className="px-3 py-0.5 rounded-full text-sm font-medium bg-blue-900/70 text-blue-300">
                    {choice.effects.duration} months
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCardTypeColor(type) {
  switch (type.toLowerCase()) {
    case 'opportunity': return 'bg-gradient-to-r from-emerald-600 to-emerald-700';
    case 'problem': return 'bg-gradient-to-r from-rose-600 to-rose-700';
    case 'market': return 'bg-gradient-to-r from-sky-600 to-sky-700';
    case 'staff': return 'bg-gradient-to-r from-amber-600 to-amber-700';
    default: return 'bg-gradient-to-r from-indigo-600 to-indigo-700';
  }
}