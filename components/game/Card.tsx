import { motion } from 'framer-motion';
import { CARD_TYPE_COLORS } from '@/lib/constants';

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
  
  const primaryColor = CARD_TYPE_COLORS[card.type as keyof typeof CARD_TYPE_COLORS] || CARD_TYPE_COLORS.opportunity;
  
  return (
    <div 
      className="rounded-lg overflow-hidden"
    >
      <div 
        className="p-2 text-white text-center rounded"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">{card.type}</span>
      </div>
      
      <div className="p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-center text-white">{card.title}</h2>
        <div className="text-sm text-slate-200 mb-3 sm:mb-4 text-center leading-snug">{card.description}</div>
        
        <div className="space-y-2.5 sm:space-y-3">
          {card.choices.map((choice, index) => (
            <motion.button
              key={index}
              onClick={() => !disabled && onDecision(choice)}
              className="cursor-pointer w-full text-left p-2.5 sm:p-3 border-2 rounded-md hover:shadow-md shadow-sm transition-all duration-200 disabled:opacity-70 bg-slate-700/50"
              style={{ 
                borderColor: `${primaryColor}40`, // 25% opacity
                '--hover-border': primaryColor
              } as React.CSSProperties & { '--hover-border': string }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = primaryColor;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = `${primaryColor}40`;
              }}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.015 }}
              whileTap={{ scale: disabled ? 1 : 0.985 }}
            >
              <div className="font-medium text-base sm:text-lg mb-1 sm:mb-1.5 text-white">{choice.label}</div>
              <div className="text-xs sm:text-sm text-slate-200 mb-2 sm:mb-2.5 leading-tight">{choice.description}</div>
              
              <div className="flex flex-wrap gap-1.5">
                {renderRangeEffect('Cash', choice.cash_min, choice.cash_max, choice.cash_is_percent, '#3B82F6')}
                {renderRangeEffect('Revenue', choice.revenue_min, choice.revenue_max, choice.revenue_is_percent, '#059669', '/mo')}
                {renderRangeEffect('Expenses', choice.expenses_min, choice.expenses_max, choice.expenses_is_percent, '#DC2626', '/mo')}
                {renderRangeEffect('Customer Rating', choice.customer_rating_min, choice.customer_rating_max, false, '#F59E0B', ' pts')}
                
                {(() => {
                  const showRevenueDuration = choice.revenue_duration && choice.revenue_duration > 1;
                  const showExpensesDuration = choice.expenses_duration && choice.expenses_duration > 1;

                  if (showRevenueDuration && showExpensesDuration && choice.revenue_duration === choice.expenses_duration) {
                    return (
                      <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-300">
                        {choice.revenue_duration} months
                      </span>
                    );
                  }
                  
                  if (showRevenueDuration || showExpensesDuration) {
                    return (
                      <>
                        {showRevenueDuration && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-300">
                            Revenue: {choice.revenue_duration} months
                          </span>
                        )}
                        {showExpensesDuration && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-300">
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
          ))}
        </div>
      </div>
    </div>
  );
}

function renderRangeEffect(label: string, min: number | undefined, max: number | undefined, isPercent: boolean | undefined, color: string, suffix = '') {
  // Skip rendering if both min and max are 0 or undefined
  if ((min === 0 || min === undefined) && (max === 0 || max === undefined)) return null;
  
  const percentSign = isPercent ? '%' : '';
  
  if (min === max || typeof max !== 'number') {
    if (typeof min !== 'number' || min === 0) return null;
    return (
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: `${color}80` }} // 50% opacity
      >
        {label}: {min > 0 ? '+' : ''}{min.toLocaleString()}{percentSign}{suffix}
      </span>
    );
  }
  
  if (typeof min === 'number' && typeof max === 'number') {
    if (min === 0 && max === 0) return null;
    return (
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: `${color}80` }} // 50% opacity
      >
        {label}: {min.toLocaleString()} to {max.toLocaleString()}{percentSign}{suffix}
      </span>
    );
  }
  
  return null;
}