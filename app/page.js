// app/page.js - Modified with unavailable industries
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { industries } from '@/lib/game-data/industries';

export default function HomePage() {
  const router = useRouter();
  
  const startGame = (industryId, isAvailable) => {
    if (isAvailable) {
      router.push(`/${industryId}`);
    }
  };

  // Only coffee shop is available for now
  const availableIndustries = ['coffee-shop'];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <motion.div 
        className="w-full max-w-md mx-auto p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Business Tycoon</h1>
            <p className="text-indigo-200">Choose your industry and build your empire</p>
          </div>
          
          <div className="p-6">
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
            
            {/* Rest of the component remains the same */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}