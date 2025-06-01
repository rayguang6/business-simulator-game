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
  cardsCollectedCount, // Use new prop
  onBackButtonClick    // Use new prop
}) => {
  const pnl = revenue - expenses;

  const StatCard: React.FC<{ icon: string; label: string; value: string; bgColorClass?: string }> = 
    ({ icon, label, value, bgColorClass = 'bg-slate-800' }) => (
    <div className={`flex-1 p-2 sm:p-3 rounded-md shadow-md ${bgColorClass} text-white min-w-[90px] sm:min-w-[100px]`}>
      <div className="flex items-center mb-0.5 sm:mb-1">
        <span className="text-md sm:text-lg mr-1 sm:mr-2">{icon}</span>
        <span className="text-[10px] sm:text-xs font-medium uppercase text-slate-400">{label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold">{value}</div>
    </div>
  );

  // Dummy onClick handler for PNL report (functionality for popup later)
  const handlePnlReportClick = () => {
    console.log("PNL Report button clicked");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-white font-sans">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-1.5 sm:p-2 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <button 
            onClick={onBackButtonClick} // Use the passed-in handler
            className="mr-1 sm:mr-2 text-lg sm:text-xl p-1 hover:bg-white/20 rounded-full"
            aria-label="Go back"
          >
            ←
          </button>
          <span className="mr-1 sm:mr-2 text-lg sm:text-xl">☕</span>
          <span className="text-xs sm:text-sm font-semibold">{industryName}</span>
        </div>
        <div className="text-xs sm:text-sm font-semibold">
          {formatMonthYear(month, year)}
        </div>
        <StarRating ratingOutOf100={customerRating} />
      </div>

      {/* Main Stats Area */}
      <div className="p-2 sm:p-2.5 bg-slate-900">
        <div className="flex flex-row justify-center items-stretch gap-2 sm:gap-3 mb-2 sm:mb-3">
          <StatCard icon="💰" label="CASH" value={formatCurrency(cash)} bgColorClass="bg-slate-800" />
          <StatCard icon="📈" label="REVENUE" value={formatCurrency(revenue)} bgColorClass="bg-slate-800" />
          <StatCard icon="🧾" label="EXPENSES" value={formatCurrency(expenses)} bgColorClass="bg-slate-800" />
        </div>
        
        {/* PNL Report Button and Month Progress Area */}
        <div className="flex justify-start items-center gap-3 sm:gap-4">
          <button 
            onClick={handlePnlReportClick}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 sm:py-2 sm:px-4 rounded-md text-xs sm:text-sm shadow-md"
          >
            📊 PNL Report
          </button>
          <span className="text-xs sm:text-sm text-slate-400">
            Cards: {cardsCollectedCount}/2
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD; 