import React from 'react';

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
  onBackButtonClick    
}) => {
  const pnl = revenue - expenses;

  const StatCard: React.FC<{ icon: string; label: string; value: string; bgColorClass?: string }> = 
    ({ icon, label, value, bgColorClass = 'bg-slate-800' }) => (
    // Adjusted min-width and padding for very small screens, and slightly larger screens
    // Using flex-shrink-0 initially to prevent shrinking, but flex-1 allows them to grow.
    <div className={`flex-1 p-1 xxs:p-1.5 xs:p-2 rounded shadow-md ${bgColorClass} text-white min-w-[70px] xxs:min-w-[75px] xs:min-w-[85px] sm:min-w-[90px]`}>
      <div className="flex items-center mb-0 xxs:mb-0.5">
        <span className="text-xs xxs:text-sm xs:text-base mr-0.5 xxs:mr-1">{icon}</span>
        <span className="text-[8px] xxs:text-[9px] xs:text-[10px] font-medium uppercase text-slate-300 xxs:text-slate-400">{label}</span>
      </div>
      <div className="text-sm xxs:text-base xs:text-lg font-bold truncate">{value}</div>
    </div>
  );

  const handlePnlReportClick = () => {
    console.log("PNL Report button clicked");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] text-white font-sans select-none">
      {/* Top Bar: Fine-tuned paddings and font sizes */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-1.5 py-1 sm:px-2 flex items-center justify-between shadow-md">
        <div className="flex items-center flex-shrink min-w-0">
          <button 
            onClick={onBackButtonClick}
            className="mr-1 text-lg p-0.5 hover:bg-white/20 rounded-full active:bg-white/30 transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
          <span className="mr-1.5 text-lg">☕</span>
          <span className="text-[11px] xs:text-xs font-semibold truncate pr-1">{industryName}</span>
        </div>
        <div className="text-[11px] xs:text-xs font-semibold px-1 text-center flex-shrink-0">
          {formatMonthYear(month, year)}
        </div>
        <div className="flex-shrink-0">
          <StarRating ratingOutOf100={customerRating} />
        </div>
      </div>

      {/* Main Stats Area: Fine-tuned paddings and gaps */}
      <div className="px-1.5 py-1 sm:px-2 sm:py-1.5 bg-slate-900">
        {/* Ensure this flex container allows cards to take up space but not wrap initially if possible */}
        <div className="flex flex-row justify-between items-stretch gap-1 xxs:gap-1.5 xs:gap-2 mb-1 xxs:mb-1.5">
          <StatCard icon="💰" label="CASH" value={formatCurrency(cash)} bgColorClass="bg-slate-800" />
          <StatCard icon="📈" label="REVENUE" value={formatCurrency(revenue)} bgColorClass="bg-slate-800" />
          <StatCard icon="🧾" label="EXPENSES" value={formatCurrency(expenses)} bgColorClass="bg-slate-800" />
        </div>
        
        {/* PNL Report Button and Month Progress Area: Fine-tuned */}
        <div className="flex justify-start items-center gap-1.5 xxs:gap-2 xs:gap-3">
          <button 
            onClick={handlePnlReportClick}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-1 px-1.5 xxs:px-2 rounded text-[9px] xxs:text-[10px] xs:text-xs shadow-md transition-colors"
          >
            📊 PNL Report
          </button>
          <span className="text-[9px] xxs:text-[10px] xs:text-xs text-slate-300 xxs:text-slate-400">
            Cards: {cardsCollectedCount}/2
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD; 