'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GameSessionService } from '@/lib/services/gameSessionService';
import { UserProfileService } from '@/lib/services/userProfileService';
import { getIndustries } from '@/lib/game-data/data-service';

interface DisplayStats {
  totalGamesStarted: number;
  gamesByIndustry: Record<string, number>;
  // We can add more detailed stats here as GameSessionService.calculateUserStats evolves
}

export default function StatsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSessionSupabase[]>([]);
  const [displayStats, setDisplayStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const profile = await UserProfileService.getCurrentUserAndProfile();
      setUserProfile(profile);
      if (!profile || !profile.id) {
        setIsLoading(false);
        return;
      }
      try {
        const [fetchedSessions, allIndustries] = await Promise.all([
          GameSessionService.getGameSessionsForCurrentUser(),
          getIndustries()
        ]);
        setSessions(fetchedSessions);
        setIndustries(allIndustries);
        const calculatedStats = GameSessionService.calculateUserStats(fetchedSessions);
        setDisplayStats(calculatedStats);
      } catch (error) {
        console.error('[StatsScreen] Error fetching or calculating stats:', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Helper to get industry name/icon
  const getIndustry = (id?: string | null) => {
    if (!id) return { name: 'Unknown', icon: '🏢' };
    const found = industries.find(i => i.id === id);
    return found ? { name: found.name, icon: found.icon } : { name: id, icon: '🏢' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <p className="text-white text-xl">Loading Your Stats...</p>
      </div>
    );
  }

  if (!userProfile) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.button
              onClick={() => router.push('/')}
              className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Menu
            </motion.button>
            <h1 className="text-3xl font-bold mb-6">📊 Your Stats</h1>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-slate-400 mb-6">Sign in or create a profile to view your game statistics.</p>
              <motion.button
                onClick={() => router.push('/')} // Navigate to home where profile modal will show
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In / Sign Up
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!displayStats || sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.button
              onClick={() => router.push('/')}
              className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Menu
            </motion.button>
            
            <h1 className="text-3xl font-bold mb-6">📊 Your Stats {userProfile?.display_name ? `for ${userProfile.display_name}` : ''}</h1>
            
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-xl font-semibold mb-2">No Games Tracked Yet</h2>
              <p className="text-slate-400 mb-6">Play your first game to start tracking your progress in Supabase!</p>
              
              <motion.button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Playing
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.button
            onClick={() => router.push('/')} 
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Menu
          </motion.button>
          <h1 className="text-3xl font-bold mb-8 text-center text-indigo-400">📊 Your Game Summary {userProfile?.display_name ? `for ${userProfile.display_name}` : ''}</h1>

          {/* Compact Stats List */}
          <ul className="divide-y divide-slate-700 bg-slate-800 rounded-lg border border-slate-700 mb-8">
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🎮</span>
              <span className="flex-1 text-slate-300">Games Played</span>
              <span className="font-bold">{displayStats.totalGamesPlayed}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🏆</span>
              <span className="flex-1 text-slate-300">Wins</span>
              <span className="font-bold text-green-400">{displayStats.totalWins}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">💀</span>
              <span className="flex-1 text-slate-300">Losses</span>
              <span className="font-bold text-red-400">{displayStats.totalLosses}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🚪</span>
              <span className="flex-1 text-slate-300">Quits</span>
              <span className="font-bold text-yellow-300">{displayStats.totalQuits}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">📈</span>
              <span className="flex-1 text-slate-300">Win Rate</span>
              <span className="font-bold">{displayStats.winRate}%</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">⏱️</span>
              <span className="flex-1 text-slate-300">Avg. Game Duration</span>
              <span className="font-bold">{displayStats.averageDurationMinutes} min</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">📅</span>
              <span className="flex-1 text-slate-300">Avg. Months Survived</span>
              <span className="font-bold">{displayStats.averageMonthsPlayed}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">💰</span>
              <span className="flex-1 text-slate-300">Highest Cash</span>
              <span className="font-bold text-amber-300">${displayStats.highestCash.toLocaleString()}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🔥</span>
              <span className="flex-1 text-slate-300">Best Win Streak</span>
              <span className="font-bold">{displayStats.bestStreak}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🏢</span>
              <span className="flex-1 text-slate-300">Most Played Industry</span>
              <span className="font-bold flex items-center gap-1">
                <span>{getIndustry(displayStats.mostPlayedIndustry).icon}</span>
                {getIndustry(displayStats.mostPlayedIndustry).name}
              </span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">⚡</span>
              <span className="flex-1 text-slate-300">Fastest Win (Months)</span>
              <span className="font-bold">{displayStats.fastestWin ?? '-'}</span>
            </li>
            <li className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">🕰️</span>
              <span className="flex-1 text-slate-300">Longest Survival (Months)</span>
              <span className="font-bold">{displayStats.longestSurvival ?? '-'}</span>
            </li>
          </ul>

          {/* Recent Games */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
            <h2 className="text-xl font-semibold px-4 pt-4 pb-2">🕒 Recent Games</h2>
            <ul className="divide-y divide-slate-700">
              {sessions.slice(0, 5).map((session) => {
                const ind = getIndustry(session.industry_id);
                return (
                  <li key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ind.icon}</span>
                      <span className="font-medium capitalize">{ind.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        session.outcome === 'started' ? 'bg-blue-900/50 text-blue-300' :
                        session.outcome === 'win' ? 'bg-green-900/50 text-green-300' :
                        session.outcome === 'bankrupt' || session.outcome === 'loss' ? 'bg-red-900/50 text-red-300' :
                        session.outcome === 'quit' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {session.outcome || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                      <div>Started: {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString()}</div>
                      {session.months_played != null && <div>Months: <span className="font-bold text-sky-300">{session.months_played}</span></div>}
                      {session.highest_cash != null && <div>Highest Cash: <span className="font-bold text-amber-300">${session.highest_cash.toLocaleString()}</span></div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 