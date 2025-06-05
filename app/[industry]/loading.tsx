"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo or game icon */}
        <div className="w-20 h-20 mx-auto mb-6 animate-spin">
          <div className="w-full h-full rounded-full border-4 border-blue-400 border-t-transparent"></div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-2xl font-bold text-white mb-2">Starting Your Business...</h2>
        <p className="text-blue-200 text-lg">Loading game assets and data</p>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
} 