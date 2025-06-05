'use client';

import { useEffect, useState } from 'react';
import { GameSessionService } from '@/lib/services/gameSessionService';
import { getIndustries } from '@/lib/game-data/data-service';
import Link from 'next/link';

// LeaderboardEntry should be available globally if defined in global.d.ts
// No, it needs to be imported if global.d.ts is not automatically included in all scopes.
// For now, let's assume it is, or define it here if necessary.
// interface LeaderboardEntry { ... } // Placeholder if not global

export default function LeaderboardPage() {
  const [cashLeaderboardData, setCashLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthsLeaderboardData, setMonthsLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [cashData, monthsData, allIndustries] = await Promise.all([
          GameSessionService.getLeaderboardData(10),
          GameSessionService.getMostMonthsSurvivedLeaderboardData(10),
          getIndustries()
        ]);
        setCashLeaderboardData(cashData.map((entry, index) => ({ ...entry, rank: index + 1 })));
        setMonthsLeaderboardData(monthsData.map((entry, index) => ({ ...entry, rank: index + 1 })));
        setIndustries(allIndustries);
      } catch (e: any) {
        console.error("Error fetching leaderboards or industries:", e);
        setError("Failed to load leaderboards. Please try again later.");
      }
      setIsLoading(false);
    };
    fetchLeaderboards();
  }, []);

  // Filtered data based on selected industry
  const filterLeaderboard = (data: LeaderboardEntry[]) => {
    if (!selectedIndustry) return data;
    return data.filter(entry => {
      // Try to match by industry_name (case-insensitive)
      const industry = industries.find(i => i.id === selectedIndustry);
      return industry && entry.industry_name && entry.industry_name.toLowerCase() === industry.name.toLowerCase();
    });
  };

  // Helper to get emoji/icon for an industry name
  const getIndustryIcon = (industryName?: string) => {
    if (!industryName) return '';
    const match = industries.find(i => i.name.toLowerCase() === industryName.toLowerCase());
    return match ? match.icon : '';
  };

  const renderLeaderboardTable = (title: string, data: LeaderboardEntry[], type: 'fastestWin' | 'mostMonths') => {
    // Always show the table for Fastest Win, even if empty
    const showEmptyMessage = data.length === 0 && type === 'fastestWin';
    return (
      <div className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-xl overflow-hidden mb-12 border border-slate-700">
        <h2 className="text-2xl font-semibold text-center text-indigo-300 py-4 bg-slate-700/50">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm sm:text-base">
            <thead className="bg-slate-700/50 border-t border-b border-slate-600">
              <tr>
                <th className="p-2 sm:p-3 font-semibold text-indigo-300">Rank</th>
                <th className="p-2 sm:p-3 font-semibold text-indigo-300">Player</th>
                <th className="p-2 sm:p-3 font-semibold text-indigo-300 text-center">Months{type === 'mostMonths' ? ' Survived' : ''}</th>
                {type === 'mostMonths' && (
                  <th className="p-2 sm:p-3 font-semibold text-indigo-300 text-right">Highest Cash Reached</th>
                )}
                <th className="p-2 sm:p-3 font-semibold text-indigo-300">Industry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.length > 0 ? (
                data.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-700/30 transition-colors duration-150">
                    <td className="p-2 sm:p-3 font-medium text-lg whitespace-nowrap">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="p-2 sm:p-3 text-slate-200 font-semibold whitespace-nowrap">{entry.display_name || '-'}</td>
                    <td className="p-2 sm:p-3 text-sky-400 font-bold text-center whitespace-nowrap">{entry.months_played ?? 'N/A'}</td>
                    {type === 'mostMonths' && (
                      <td className="p-2 sm:p-3 text-right font-mono text-amber-300">
                        ${(entry.highest_cash ?? entry.final_cash ?? 0).toLocaleString()}
                      </td>
                    )}
                    <td className="p-2 sm:p-3 text-slate-400 whitespace-nowrap">
                      <span className="mr-1">{getIndustryIcon(entry.industry_name)}</span>{entry.industry_name || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : showEmptyMessage ? (
                <tr>
                  <td colSpan={type === 'mostMonths' ? 5 : 4} className="p-6 text-center text-slate-400 text-lg">
                    No one has won in this industry yet.<br />
                    <span className="text-indigo-300 font-semibold">Be the first to win and claim the top spot!</span>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-start mb-4">
        <Link href="/" legacyBehavior>
          <a className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors duration-200 text-base font-semibold">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Main Menu
          </a>
        </Link>
      </div>
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center gap-3 mb-6">
        <label htmlFor="industry-filter" className="text-slate-300 font-medium">Filter by Industry:</label>
        <select
          id="industry-filter"
          value={selectedIndustry}
          onChange={e => setSelectedIndustry(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Industries</option>
          {industries.map(ind => (
            <option key={ind.id} value={ind.id}>
              {ind.icon ? `${ind.icon} ` : ''}{ind.name}
            </option>
          ))}
        </select>
      </div>
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
          {renderLeaderboardTable("Fastest Win (Fewest Months)", filterLeaderboard(cashLeaderboardData), 'fastestWin')}
          {renderLeaderboardTable("Most Months Survived", filterLeaderboard(monthsLeaderboardData), 'mostMonths')}
        </>
      )}

      <footer className="w-full max-w-4xl mt-12 text-center">
        <p className="mt-6 text-xs text-slate-500">
          Business Simulator Game - All Rights Reserved
        </p>
      </footer>
    </div>
  );
} 