import { supabase } from '../supabase';
import { UserProfileService } from './userProfileService';

export class GameSessionService {
  /**
   * Logs a complete game session to Supabase.
   */
  static async logCompletedGameSession(
    industryId: string,
    outcome: 'win' | 'loss' | 'quit' | 'bankrupt', // Expanded outcome
    finalCash: number,
    monthsPlayed: number,
    cardsPlayed: number,
    sessionStartTime: number, // Timestamp from GameScreen
    sessionEndTime: number, // Timestamp from GameScreen
    highestCash: number // new argument
  ): Promise<void> {
    const currentUser = await UserProfileService.getCurrentAuthUser();
    if (!currentUser) {
      console.warn('[GameSessionService] No authenticated user found. Cannot log game session.');
      return;
    }

    const duration_minutes = Math.round((sessionEndTime - sessionStartTime) / (1000 * 60));

    const dataToInsert = {
      user_id: currentUser.id,
      industry_id: industryId,
      start_time: new Date(sessionStartTime).toISOString(),
      end_time: new Date(sessionEndTime).toISOString(),
      duration_minutes: duration_minutes,
      cards_played: cardsPlayed,
      months_played: monthsPlayed,
      outcome: outcome === 'bankrupt' ? 'loss' : outcome, // Map bankrupt to loss for DB consistency if needed, or keep bankrupt
      final_cash: finalCash,
      highest_cash: highestCash, // new field
    };

    console.log('[GameSessionService] Attempting to log completed game session:', dataToInsert);

    const { error } = await supabase
      .from('game_sessions')
      .insert(dataToInsert);

    if (error) {
      console.error('[GameSessionService] Error logging completed game session:', error.message);
    } else {
      console.log('[GameSessionService] Completed game session logged successfully.');
    }
  }

  static async getGameSessionsForCurrentUser(): Promise<GameSessionSupabase[]> {
    const currentUser = await UserProfileService.getCurrentAuthUser();
    if (!currentUser) {
      console.warn('[GameSessionService] No authenticated user found. Cannot fetch game sessions.');
      return [];
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[GameSessionService] Error fetching game sessions:', error.message);
      return [];
    }
    return data || [];
  }

  static calculateUserStats(sessions: GameSessionSupabase[]): any {
    if (!sessions || sessions.length === 0) {
      return {
        totalGamesPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        totalQuits: 0,
        winRate: 0,
        averageMonthsPlayed: 0,
        averageDurationMinutes: 0,
        highestCash: 0,
        bestStreak: 0,
        mostPlayedIndustry: null,
        fastestWin: null,
        longestSurvival: null,
        gamesByIndustry: {},
      };
    }

    const totalGamesPlayed = sessions.length;
    const totalWins = sessions.filter(s => s.outcome === 'win').length;
    const totalLosses = sessions.filter(s => s.outcome === 'loss' || s.outcome === 'bankrupt').length;
    const totalQuits = sessions.filter(s => s.outcome === 'quit').length;
    const winRate = totalGamesPlayed > 0 ? Math.round((totalWins / totalGamesPlayed) * 100) : 0;

    const completedSessions = sessions.filter(s => s.duration_minutes != null && s.outcome !== 'started');
    const averageDurationMinutes = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
      : 0;
    const averageMonthsPlayed = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.months_played || 0), 0) / completedSessions.length
      : 0;
    const highestCash = Math.max(...sessions.map(s => s.highest_cash ?? s.final_cash ?? 0).filter(c => c !== null), 0);

    // Best win streak (consecutive wins)
    let bestStreak = 0, currentStreak = 0;
    for (const s of sessions) {
      if (s.outcome === 'win') {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    // Most played industry
    const gamesByIndustry = sessions.reduce((acc, session) => {
      if (session.industry_id) {
        acc[session.industry_id] = (acc[session.industry_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    let mostPlayedIndustry = null;
    let maxPlays = 0;
    for (const [ind, count] of Object.entries(gamesByIndustry)) {
      if (count > maxPlays) {
        mostPlayedIndustry = ind;
        maxPlays = count;
      }
    }

    // Fastest win (fewest months)
    const winSessions = sessions.filter(s => s.outcome === 'win' && s.months_played != null);
    const fastestWin = winSessions.length > 0 ? Math.min(...winSessions.map(s => s.months_played!)) : null;

    // Longest survival (most months)
    const longestSurvival = completedSessions.length > 0 ? Math.max(...completedSessions.map(s => s.months_played || 0)) : null;

    return {
      totalGamesPlayed,
      totalWins,
      totalLosses,
      totalQuits,
      winRate,
      averageMonthsPlayed: parseFloat(averageMonthsPlayed.toFixed(1)),
      averageDurationMinutes: parseFloat(averageDurationMinutes.toFixed(1)),
      highestCash,
      bestStreak,
      mostPlayedIndustry,
      fastestWin,
      longestSurvival,
      gamesByIndustry,
    };
  }

  static async getLeaderboardData(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Fastest Win: Only sessions with outcome 'win', sorted by months_played ascending
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        final_cash,
        highest_cash,
        outcome,
        months_played,
        user_profiles (display_name),
        industries (name)
      `)
      .eq('outcome', 'win')
      .not('months_played', 'is', null)
      .order('months_played', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[GameSessionService] Error fetching fastest win leaderboard data:', error.message);
      return [];
    }
    if (!data) return [];
    return data.map((session: any) => ({
      display_name: session.user_profiles?.display_name || 'Anonymous',
      final_cash: session.final_cash,
      highest_cash: session.highest_cash,
      industry_name: session.industries?.name || 'Unknown Industry',
      outcome: session.outcome,
      months_played: session.months_played,
    }));
  }

  static async getMostMonthsSurvivedLeaderboardData(limit: number = 10): Promise<LeaderboardEntry[]> {
    // Most Months Survived: All sessions, sorted by months_played descending
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        final_cash,
        highest_cash,
        outcome,
        months_played,
        user_profiles (display_name),
        industries (name)
      `)
      .not('months_played', 'is', null)
      .order('months_played', { ascending: false })
      .order('final_cash', { ascending: false }) // Secondary sort by cash for ties
      .limit(limit);

    if (error) {
      console.error('[GameSessionService] Error fetching most months survived leaderboard data:', error.message);
      return [];
    }
    if (!data) return [];
    return data.map((session: any) => ({
      display_name: session.user_profiles?.display_name || 'Anonymous',
      final_cash: session.final_cash,
      highest_cash: session.highest_cash,
      industry_name: session.industries?.name || 'Unknown Industry',
      outcome: session.outcome,
      months_played: session.months_played,
    }));
  }
}