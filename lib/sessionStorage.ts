// Session storage utilities for tracking game sessions

export interface GameSession {
  sessionId: string;
  startTime: number; // timestamp
  industry: string;
  cardsPlayed: number;
  monthsPlayed: number;
  gameOutcome: 'playing' | 'won' | 'bankrupt' | 'quit';
  finalCash?: number;
  playTimeMinutes?: number;
}

const SESSION_STORAGE_KEY = 'business-simulator-sessions';

// Save a session to localStorage
export const saveSession = (session: GameSession): void => {
  try {
    const existingSessions = getSavedSessions();
    const updatedSessions = [...existingSessions, session];
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSessions));
    console.log('Session saved:', session.sessionId);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

// Get all saved sessions from localStorage
export const getSavedSessions = (): GameSession[] => {
  try {
    const sessionsJson = localStorage.getItem(SESSION_STORAGE_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
};

// Clear all sessions (for debugging/reset)
export const clearAllSessions = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('All sessions cleared');
  } catch (error) {
    console.error('Failed to clear sessions:', error);
  }
};

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  // (window as any).logSessionStats = logSessionStats; // logSessionStats was removed
  (window as any).clearAllSessions = clearAllSessions;
} 