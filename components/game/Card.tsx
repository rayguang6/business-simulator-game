import { motion } from 'framer-motion';

interface CardProps {
  card: Card;
  onDecision: (choice: CardChoice) => void;
  disabled?: boolean;
  effectDetails?: {
    cash?: { percent: number, value: number } | null;
    revenue?: { percent: number, value: number } | null;
    expenses?: { percent: number, value: number } | null;
  };
}

export default function Card({ card, onDecision, disabled, effectDetails }: CardProps) {
  if (!card) return null;
  
  return (
    <div className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
      <div className={`p-2 text-white text-center ${getCardTypeColor(card.type)}`}>
        <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">{card.type}</span>
      </div>
      
      <div className="p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-center text-white">{card.title}</h2>
        <div className="text-sm text-slate-300 mb-3 sm:mb-4 text-center leading-snug">{card.description}</div>
        
        <div className="space-y-2.5 sm:space-y-3">
          {card.choices.map((choice, index) => {
            return (
              <motion.button
                key={index}
                onClick={() => {
                  !disabled && onDecision(choice);
                }}
                className="cursor-pointer w-full text-left p-2.5 sm:p-3 border border-slate-600 rounded-md hover:border-indigo-400 hover:shadow-md shadow-sm transition-all duration-200 disabled:opacity-70 bg-slate-800"
                disabled={disabled}
                whileHover={{ scale: disabled ? 1 : 1.015 }}
                whileTap={{ scale: disabled ? 1 : 0.985 }}
              >
                <div className="font-medium text-base sm:text-lg mb-1 sm:mb-1.5 text-white">{choice.label}</div>
                <div className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-2.5 leading-tight">{choice.description}</div>
                
                <div className="flex flex-wrap gap-1.5">
                  {renderRangeEffect('Cash', choice.cash_min, choice.cash_max, choice.cash_is_percent, 'green')}
                  {renderRangeEffect('Revenue', choice.revenue_min, choice.revenue_max, choice.revenue_is_percent, 'emerald', '/mo')}
                  {renderRangeEffect('Expenses', choice.expenses_min, choice.expenses_max, choice.expenses_is_percent, 'red', '/mo')}
                  {renderRangeEffect('Customer Rating', choice.customer_rating_min, choice.customer_rating_max, false, 'amber', ' pts')}
                  
                  {(() => {
                    const showRevenueDuration = choice.revenue_duration && choice.revenue_duration > 1;
                    const showExpensesDuration = choice.expenses_duration && choice.expenses_duration > 1;

                    if (showRevenueDuration && showExpensesDuration && choice.revenue_duration === choice.expenses_duration) {
                      return (
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 text-blue-300">
                          {choice.revenue_duration} months
                        </span>
                      );
                    }
                    
                    if (showRevenueDuration || showExpensesDuration) {
                      return (
                        <>
                          {showRevenueDuration && (
                            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 text-blue-300">
                              Revenue: {choice.revenue_duration} months
                            </span>
                          )}
                          {showExpensesDuration && (
                            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 text-blue-300">
                              Expenses: {choice.expenses_duration} months
                            </span>
                          )}
                        </>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getTailwindColor(color: string, type: 'bg' | 'text'): string {
  switch (color) {
    case 'green':
      return type === 'bg' ? 'bg-green-900/70' : 'text-green-400';
    case 'emerald':
      return type === 'bg' ? 'bg-emerald-900/70' : 'text-emerald-400';
    case 'red':
      return type === 'bg' ? 'bg-red-900/70' : 'text-red-400';
    case 'amber':
      return type === 'bg' ? 'bg-amber-900/70' : 'text-amber-400';
    case 'blue':
      return type === 'bg' ? 'bg-blue-900/70' : 'text-blue-400';
    default:
      return type === 'bg' ? 'bg-slate-900/70' : 'text-slate-400';
  }
}

function renderRangeEffect(label: string, min: number | undefined, max: number | undefined, isPercent: boolean | undefined, color: string, suffix = '') {
  // Skip rendering if both min and max are 0 or undefined
  if ((min === 0 || min === undefined) && (max === 0 || max === undefined)) return null;
  
  const percentSign = isPercent ? '%' : '';
  if (min === max || typeof max !== 'number') {
    if (typeof min !== 'number' || min === 0) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTailwindColor(color, 'bg')} ${getTailwindColor(color, 'text')}`}>
        {label}: {min > 0 ? '+' : ''}{min.toLocaleString()}{percentSign}{suffix}
      </span>
    );
  }
  if (typeof min === 'number' && typeof max === 'number') {
    if (min === 0 && max === 0) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTailwindColor(color, 'bg')} ${getTailwindColor(color, 'text')}`}>
        {label}: {min.toLocaleString()} to {max.toLocaleString()}{percentSign}{suffix}
      </span>
    );
  }
  return null;
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