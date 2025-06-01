'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GameSessionService } from '@/lib/services/gameSessionService';
import { UserProfileService } from '@/lib/services/userProfileService';

interface DisplayStats {
  totalGamesStarted: number;
  gamesByIndustry: Record<string, number>;
  // We can add more detailed stats here as GameSessionService.calculateUserStats evolves
}

export default function StatsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSessionSupabase[]>([]);
  const [displayStats, setDisplayStats] = useState<DisplayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const profile = await UserProfileService.getCurrentUserAndProfile();
      setUserProfile(profile);

      if (!profile || !profile.id) {
        console.warn('[StatsScreen] No user profile found. Cannot fetch stats.');
        setIsLoading(false);
        // Optionally, redirect to login or show a message
        return;
      }

      try {
        const fetchedSessions = await GameSessionService.getGameSessionsForCurrentUser();
        setSessions(fetchedSessions);
        const calculatedStats = GameSessionService.calculateUserStats(fetchedSessions);
        setDisplayStats(calculatedStats);
      } catch (error) {
        console.error('[StatsScreen] Error fetching or calculating stats:', error);
        // Handle error state in UI if necessary
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

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
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => router.push('/')}
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Menu
          </motion.button>
          
          <h1 className="text-3xl font-bold mb-8 text-center">📊 Your Game Statistics {userProfile?.display_name ? `for ${userProfile.display_name}` : ''}</h1>
          
          {/* Stats Cards - Updated for Supabase data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-2">🎮</div>
              <div className="text-2xl font-bold">{displayStats.totalGamesStarted}</div>
              <div className="text-slate-400">Total Games Started</div>
            </div>
            
            {/* Placeholder for more stats like Win Rate, Best Cash once available */}
            {/* For now, let's show games by industry if available */}
            {Object.keys(displayStats.gamesByIndustry).length > 0 && (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 md:col-span-1">
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="text-slate-400 mb-1">Games by Industry</div>
                    {Object.entries(displayStats.gamesByIndustry).map(([industry, count]) => (
                        <div key={industry} className="flex justify-between text-sm">
                            <span className="capitalize">{industry.replace(/[-_]/g, ' ')}</span>
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Recent Games - Updated for Supabase data */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">🕒 Recent Game Starts</h2>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => ( // Show latest 5, sessions are already ordered by start_time desc
                <div key={session.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{session.industry_id.replace(/[-_]/g, ' ')}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      session.outcome === 'started' ? 'bg-blue-900/50 text-blue-300' :
                      session.outcome === 'won' ? 'bg-green-900/50 text-green-300' :
                      session.outcome === 'bankrupt' || session.outcome === 'loss' ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-900/50 text-gray-300'
                    }`}>
                      {session.outcome || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <div>Started: {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString()}</div>
                    {/* More details like final cash, months played can be added when available */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 