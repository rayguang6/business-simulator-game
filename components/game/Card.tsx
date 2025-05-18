import { motion } from 'framer-motion';

interface CardProps {
  card: Card;
  onDecision: (choice: CardChoice) => void;
  disabled?: boolean;
}

export default function Card({ card, onDecision, disabled }: CardProps) {
  if (!card) return null;
  
  return (
    <div className="bg-slate-700 rounded-xl overflow-hidden border border-slate-600 shadow-lg">
      <div className={`p-3 text-white text-center ${getCardTypeColor(card.type)}`}>
        <span className="font-medium uppercase tracking-wider text-sm">{card.type}</span>
      </div>
      
      <div className="p-5">
        <h2 className="text-xl font-bold mb-2 text-center text-white">{card.title}</h2>
        <div className="text-slate-300 mb-6 text-center">{card.description}</div>
        
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
                {renderEffect('Cash', choice.cash, 'green')}
                {renderEffect('Revenue', choice.revenue, 'emerald', '/mo')}
                {renderEffect('Expenses', choice.expenses, 'red', '/mo')}
                {renderEffect('Customer Rating', choice.customerRating, 'amber', ' pts')}
                {choice.duration > 1 && (
                  <span className="px-3 py-0.5 rounded-full text-sm font-medium bg-blue-900/70 text-blue-300">
                    {choice.duration} months
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

function renderEffect(label: string, value: number, color: string, suffix = '') {
  if (typeof value !== 'number' || value === 0) return null;
  const valueDisplay = `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
  return (
    <span
      className={`px-3 py-0.5 rounded-full text-sm font-medium bg-${color}-900/70 text-${color}-400`}
    >
      {label}: {valueDisplay}{suffix}
    </span>
  );
}

function getCardTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case 'opportunity': return 'bg-gradient-to-r from-emerald-600 to-emerald-700';
    case 'problem': return 'bg-gradient-to-r from-rose-600 to-rose-700';
    case 'market': return 'bg-gradient-to-r from-sky-600 to-sky-700';
    case 'staff': return 'bg-gradient-to-r from-amber-600 to-amber-700';
    default: return 'bg-gradient-to-r from-indigo-600 to-indigo-700';
  }
}