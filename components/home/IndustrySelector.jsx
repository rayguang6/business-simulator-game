// components/home/IndustrySelector.jsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function IndustrySelector({ industries, availableIndustries }) {
  const router = useRouter();
  
  const startGame = (industryId, isAvailable) => {
    if (isAvailable) {
      router.push(`/${industryId}`);
    }
  };

  return (
    <div className="space-y-3">
      {industries.map((industry) => {
        const isAvailable = availableIndustries.includes(industry.id);
        
        return (
          <motion.button
            key={industry.id}
            onClick={() => startGame(industry.id, isAvailable)}
            className={`cursor-pointer w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 shadow-md 
              ${isAvailable 
                ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-indigo-400' 
                : 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-70'}`}
            whileHover={{ scale: isAvailable ? 1.02 : 1 }}
            whileTap={{ scale: isAvailable ? 0.98 : 1 }}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{industry.icon}</span>
              <div className="text-left">
                <div className="flex items-center">
                  <span className="font-semibold text-white">{industry.name}</span>
                  {!isAvailable && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded-full">Coming Soon</span>
                  )}
                </div>
                {isAvailable && (
                  <div className="flex space-x-3 mt-1">
                    <span className="text-xs text-amber-300">💰 ${industry.startingCash.toLocaleString()}</span>
                    <span className="text-xs text-green-300">📈 ${industry.startingRevenue.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
            {isAvailable && <span className="text-blue-400 text-lg">→</span>}
          </motion.button>
        );
      })}
    </div>
  );
}