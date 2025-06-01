'use client';

import { useEffect, useState } from 'react';
import { GameSessionService } from '@/lib/services/gameSessionService';
import Link from 'next/link';

// LeaderboardEntry should be available globally if defined in global.d.ts
// No, it needs to be imported if global.d.ts is not automatically included in all scopes.
// For now, let's assume it is, or define it here if necessary.
// interface LeaderboardEntry { ... } // Placeholder if not global

export default function LeaderboardPage() {
  const [cashLeaderboardData, setCashLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthsLeaderboardData, setMonthsLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cashData = await GameSessionService.getLeaderboardData(10);
        const monthsData = await GameSessionService.getMostMonthsSurvivedLeaderboardData(10);
        
        setCashLeaderboardData(cashData.map((entry, index) => ({ ...entry, rank: index + 1 })));
        setMonthsLeaderboardData(monthsData.map((entry, index) => ({ ...entry, rank: index + 1 })));

      } catch (e: any) {
        console.error("Error fetching leaderboards:", e);
        setError("Failed to load leaderboards. Please try again later.");
      }
      setIsLoading(false);
    };

    fetchLeaderboards();
  }, []);

  const renderLeaderboardTable = (title: string, data: LeaderboardEntry[], primaryMetric: 'cash' | 'months') => {
    if (!isLoading && !error && data.length === 0) {
      return (
        <div className="text-center text-slate-500 mt-10">
          <p className="text-2xl">No scores for "{title}" yet!</p>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-xl overflow-hidden mb-12">
        <h2 className="text-2xl font-semibold text-center text-indigo-300 py-4 bg-slate-700/50">{title}</h2>
        <table className="w-full text-left">
          <thead className="bg-slate-700/50 border-t border-b border-slate-600">
            <tr>
              <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300">Rank</th>
              <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300">Player</th>
              {primaryMetric === 'cash' ? (
                <>
                  <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 text-right">Score (Cash)</th>
                  <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 hidden md:table-cell text-center">Months</th>
                </>
              ) : (
                <>
                  <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 text-center">Months Survived</th>
                  <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 hidden md:table-cell text-right">Final Cash</th>
                </>
              )}
              <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 hidden md:table-cell">Industry</th>
              <th className="p-3 sm:p-4 text-sm font-semibold text-indigo-300 hidden sm:table-cell">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((entry) => (
              <tr key={entry.rank} className="hover:bg-slate-700/30 transition-colors duration-150">
                <td className="p-3 sm:p-4 font-medium text-lg">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </td>
                <td className="p-3 sm:p-4 text-slate-200 font-semibold">{entry.display_name || '-'}</td>
                {primaryMetric === 'cash' ? (
                  <>
                    <td className="p-3 sm:p-4 text-amber-400 font-bold text-right">${entry.final_cash?.toLocaleString() || 'N/A'}</td>
                    <td className="p-3 sm:p-4 text-slate-300 hidden md:table-cell text-center">{entry.months_played ?? 'N/A'}</td>
                  </>
                ) : (
                  <>
                    <td className="p-3 sm:p-4 text-sky-400 font-bold text-center">{entry.months_played ?? 'N/A'}</td>
                    <td className="p-3 sm:p-4 text-amber-300 hidden md:table-cell text-right">${entry.final_cash?.toLocaleString() || 'N/A'}</td>
                  </>
                )}
                <td className="p-3 sm:p-4 text-slate-400 hidden md:table-cell">{entry.industry_name || 'N/A'}</td>
                <td className="p-3 sm:p-4 text-slate-300 hidden sm:table-cell">
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${entry.outcome === 'win' ? 'bg-green-500/20 text-green-300' : 
                      entry.outcome === 'loss' || entry.outcome === 'bankrupt' ? 'bg-red-500/20 text-red-300' : 
                      entry.outcome === 'quit' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-600 text-slate-400'}
                  `}>
                    {entry.outcome ? entry.outcome.charAt(0).toUpperCase() + entry.outcome.slice(1) : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-400 mb-2">🏆 Leaderboards 🏆</h1>
        <p className="text-slate-400">See who's at the top of the game!</p>
      </header>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="mt-4 text-xl text-slate-300">Loading Leaderboards...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-800/50 border border-red-700 text-red-300 p-4 rounded-lg w-full max-w-md text-center">
          <p className="font-semibold">Error!</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          {renderLeaderboardTable("Top Scores (by Cash)", cashLeaderboardData, 'cash')}
          {renderLeaderboardTable("Most Months Survived", monthsLeaderboardData, 'months')}
        </>
      )}

      <footer className="w-full max-w-4xl mt-12 text-center">
        <Link href="/" legacyBehavior>
          <a className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
            Back to Main Menu
          </a>
        </Link>
        <p className="mt-6 text-xs text-slate-500">
          Business Simulator Game - All Rights Reserved
        </p>
      </footer>
    </div>
  );
} 