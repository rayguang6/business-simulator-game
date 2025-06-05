import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EffectAnimationItem } from './GameScreen';
import StatDeltaAnimation from './StatDeltaAnimation';

interface GameHUDProps {
  cash: number;
  revenue: number;
  expenses: number;
  customerRating: number; // Percentage 0-100
  month: number;
  year: number;
  industryName: string;
  cardsCollectedCount: number; // New prop for month progress
  onBackButtonClick: () => void; // New prop for back button callback
  effectAnimations?: EffectAnimationItem[];      // New prop for animations
  onAnimationComplete?: (id: string) => void; // New prop for callback
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatMonthYear = (month: number, year: number) => {
  return `${monthNames[month]} ${year}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Helper to generate star icons based on rating (0-100 -> 0-5 stars)
const StarRating: React.FC<{ ratingOutOf100: number }> = ({ ratingOutOf100 }) => {
  const stars = Math.max(0, Math.min(5, Math.round(ratingOutOf100 / 20)));
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg 
          key={i} 
          className={`w-4 h-4 sm:w-5 sm:h-5 ${i < stars ? 'text-yellow-400' : 'text-gray-500'}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.386 2.458a1 1 0 00-.364 1.118l1.287 3.971c.3.921-.755 1.688-1.54 1.118l-3.386-2.458a1 1 0 00-1.175 0l-3.386 2.458c-.784.57-1.838-.197-1.539-1.118l1.287-3.971a1 1 0 00-.364-1.118L2.28 9.407c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
        </svg>
      ))}
    </div>
  );
};

const GameHUD: React.FC<GameHUDProps> = ({ 
  cash, 
  revenue, 
  expenses, 
  customerRating, 
  month, 
  year, 
  industryName,
  cardsCollectedCount, 
  onBackButtonClick,    
  effectAnimations = [],    // Default to empty array
  onAnimationComplete = () => {} // Default to no-op function
}) => {
  const pnl = revenue - expenses;

  const StatCard: React.FC<{ 
    icon: string; 
    label: string; 
    value: string; 
    metricType: EffectAnimationItem['metric'];
    bgColorClass?: string 
  }> = 
    ({ icon, label, value, metricType, bgColorClass = 'bg-slate-800' }) => (
    <div className={`rounded-lg backdrop-blur-md border border-white/10 relative flex-1 p-1 xxs:p-1.5 xs:p-2 shadow-md text-white min-w-[70px] xxs:min-w-[75px] xs:min-w-[85px] sm:min-w-[90px]`}
    style={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.15)'
    }}
    >
      <div className="flex items-center mb-0 xxs:mb-0.5">
        <span className="text-xs xxs:text-sm xs:text-base mr-0.5 xxs:mr-1">{icon}</span>
        <span className="text-[8px] xxs:text-[9px] xs:text-[10px] font-medium uppercase text-slate-200">{label}</span>
      </div>
      <div className="text-sm xxs:text-base xs:text-lg font-bold truncate">{value}</div>
      <AnimatePresence>
        {effectAnimations
          .filter(anim => anim.metric === metricType)
          .map(animItem => (
            <StatDeltaAnimation 
              key={animItem.id} 
              animationItem={animItem} 
              onComplete={onAnimationComplete} 
            />
          ))}
      </AnimatePresence>
    </div>
  );

  const handlePnlReportClick = () => {
    console.log("PNL Report button clicked");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] text-white font-sans select-none">
      {/* Top Bar: Fine-tuned paddings and font sizes */}
      <div className="px-1.5 py-1 sm:px-2 flex items-center justify-between shadow-md backdrop-blur-lg border-b border-white/10"
        style={{ 
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        <div className="flex items-center flex-shrink min-w-0">
          <button 
            onClick={onBackButtonClick}
            className="mr-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg p-2 shadow-md flex items-center justify-center w-10 h-10"
            aria-label="Go back"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-300">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="mr-1.5 text-lg">☕</span>
          <span className="text-[11px] xs:text-xs font-semibold truncate pr-1">{industryName}</span>
        </div>
        <div className="text-[11px] xs:text-xs font-semibold px-1 text-center flex-shrink-0">
          {formatMonthYear(month, year)}
        </div>
        <div className="relative flex-shrink-0">
          <StarRating ratingOutOf100={customerRating} />
          <AnimatePresence>
            {effectAnimations
              .filter(anim => anim.metric === 'customerRating')
              .map(animItem => (
                <StatDeltaAnimation 
                  key={animItem.id} 
                  animationItem={animItem} 
                  onComplete={onAnimationComplete} 
                  customPositionStyle={{ 
                    top: '15%',
                    transform: 'translateY(-50%)',
                    right: 'calc(100% + 4px)',
                    zIndex: 10 
                  }}
                />
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Stats Area: Fine-tuned paddings and gaps */}
      <div className="px-1.5 py-1 sm:px-2 sm:py-1.5 backdrop-blur-sm"
        style={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.02) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="flex flex-row justify-between items-stretch gap-1 xxs:gap-1.5 xs:gap-2 mb-1 xxs:mb-1.5">
          <StatCard icon="💰" label="CASH" value={formatCurrency(cash)} metricType="cash" bgColorClass="bg-slate-800" />
          <StatCard icon="📈" label="REVENUE" value={formatCurrency(revenue)} metricType="revenue" bgColorClass="bg-slate-800" />
          <StatCard icon="🧾" label="EXPENSES" value={formatCurrency(expenses)} metricType="expenses" bgColorClass="bg-slate-800" />
        </div>
        
        {/* PNL Report Button and Month Progress Area: Fine-tuned */}
        <div className="flex justify-start items-center gap-1.5 xxs:gap-2 xs:gap-3">
          <button 
            onClick={handlePnlReportClick}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-1 px-1.5 xxs:px-2 rounded text-[9px] xxs:text-[10px] xs:text-xs shadow-md transition-colors"
          >
            📊 PNL Report
          </button>
          <span className="text-[9px] xxs:text-[10px] xs:text-xs text-slate-200">
            Cards: {cardsCollectedCount}/2
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD; 