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
    sessionEndTime: number // Timestamp from GameScreen
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
        totalGamesPlayed: 0, // Renamed from totalGamesStarted
        gamesByIndustry: {},
        totalWins: 0,
        totalLosses: 0,
        totalQuits: 0,
        averageDurationMinutes: 0,
        averageMonthsPlayed: 0,
        highestCash: 0,
      };
    }

    const totalGamesPlayed = sessions.length;
    const gamesByIndustry = sessions.reduce((acc, session) => {
      if (session.industry_id) {
        acc[session.industry_id] = (acc[session.industry_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalWins = sessions.filter(s => s.outcome === 'win').length;
    // Assuming 'bankrupt' is also a loss. If you use 'bankrupt' as a distinct outcome in DB, adjust here.
    const totalLosses = sessions.filter(s => s.outcome === 'loss' || s.outcome === 'bankrupt').length; 
    const totalQuits = sessions.filter(s => s.outcome === 'quit').length;
    
    const completedSessions = sessions.filter(s => s.duration_minutes != null && s.outcome !== 'started'); // Exclude 'started' if any exist
    const averageDurationMinutes = completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
        : 0;

    const averageMonthsPlayed = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.months_played || 0), 0) / completedSessions.length
        : 0;

    const highestCash = Math.max(...sessions.map(s => s.final_cash || 0).filter(c => c !== null), 0);

    return {
      totalGamesPlayed,
      gamesByIndustry,
      totalWins,
      totalLosses,
      totalQuits,
      averageDurationMinutes: parseFloat(averageDurationMinutes.toFixed(1)),
      averageMonthsPlayed: parseFloat(averageMonthsPlayed.toFixed(1)),
      highestCash,
    };
  }

  static async getLeaderboardData(limit: number = 10): Promise<LeaderboardEntry[]> {
    console.log(`[GameSessionService] Fetching leaderboard data with limit: ${limit}`);
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        final_cash,
        outcome,
        months_played,
        user_profiles (display_name),
        industries (name)
      `)
      .not('final_cash', 'is', null)
      .order('final_cash', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GameSessionService] Error fetching leaderboard data:', error.message);
      return [];
    }

    if (!data) {
      console.log('[GameSessionService] No leaderboard data found.');
      return [];
    }

    console.log('[GameSessionService] Raw leaderboard data from Supabase:', data);

    // Transform the data to match LeaderboardEntry
    const leaderboardEntries: LeaderboardEntry[] = data.map((session: any) => ({
      // The 'any' type for session is used here because Supabase returns a complex nested structure based on the select query.
      // We then pick the specific fields we need.
      display_name: session.user_profiles?.display_name || 'Anonymous',
      final_cash: session.final_cash,
      industry_name: session.industries?.name || 'Unknown Industry',
      outcome: session.outcome,
      months_played: session.months_played,
    }));

    console.log('[GameSessionService] Transformed leaderboard entries:', leaderboardEntries);
    return leaderboardEntries;
  }

  static async getMostMonthsSurvivedLeaderboardData(limit: number = 10): Promise<LeaderboardEntry[]> {
    console.log(`[GameSessionService] Fetching most months survived leaderboard data with limit: ${limit}`);
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        final_cash,
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

    if (!data) {
      console.log('[GameSessionService] No most months survived leaderboard data found.');
      return [];
    }

    console.log('[GameSessionService] Raw most months survived data from Supabase:', data);

    const leaderboardEntries: LeaderboardEntry[] = data.map((session: any) => ({
      display_name: session.user_profiles?.display_name || 'Anonymous',
      final_cash: session.final_cash,
      months_played: session.months_played,
      industry_name: session.industries?.name || 'Unknown Industry',
      outcome: session.outcome,
    }));

    console.log('[GameSessionService] Transformed most months survived leaderboard entries:', leaderboardEntries);
    return leaderboardEntries;
  }
}