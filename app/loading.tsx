"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Simple spinner */}
        <div className="w-16 h-16 mx-auto mb-4">
          <div className="w-full h-full rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
        <p className="text-blue-200">Please wait</p>
      </div>
    </div>
  );
} 