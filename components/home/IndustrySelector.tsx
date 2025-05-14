// components/home/IndustrySelector.jsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';

export default function IndustrySelector({ industries }: { industries: Industry[] }) {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);

  const startGame = (industry: Industry) => {
    if (industry.isAvailable) {
      setSelectedIndustry(industry);
      router.push(`/${industry.id}`);
    }
  };

  return (
    <div className="space-y-3">
      {industries.map((industry: Industry) => {
        return (
          <motion.button
            key={industry.id}
            onClick={() => startGame(industry)}
            className={`cursor-pointer w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 shadow-md 
              ${industry.isAvailable 
                ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-indigo-400' 
                : 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-70'}`}
            whileHover={{ scale: industry.isAvailable ? 1.02 : 1 }}
            whileTap={{ scale: industry.isAvailable ? 0.98 : 1 }}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{industry.icon}</span>
              <div className="text-left">
                <div className="flex items-center">
                  <span className="font-semibold text-white">{industry.name}</span>
                  {!industry.isAvailable && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded-full">Coming Soon</span>
                  )}
                </div>
                {industry.isAvailable && (
                  <div className="flex space-x-3 mt-1">
                    <span className="text-xs text-amber-300">💰 ${industry.startingCash.toLocaleString()}</span>
                    <span className="text-xs text-green-300">📈 ${industry.startingRevenue.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
            {industry.isAvailable && <span className="text-blue-400 text-lg">→</span>}
          </motion.button>
        );
      })}
    </div>
  );
}