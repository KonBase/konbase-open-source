import { logDebug } from '@/utils/debug';

/**
 * Saves the current path to localStorage for later restoration
 */
export const saveCurrentPath = (path: string): void => {
  try {
    // Don't save login/register/etc paths
    const publicPaths = ['/login', '/register', '/setup', '/forgot-password', '/reset-password'];
    if (publicPaths.includes(path)) return;
    
    localStorage.setItem('kb_last_path', path);
    logDebug('Saved current path', { path }, 'info');
  } catch (error) {
    console.error('Error saving path to localStorage:', error);
  }
};

/**
 * Retrieves the last visited path from localStorage
 */
export const getLastVisitedPath = (defaultPath: string = '/dashboard'): string => {
  try {
    const savedPath = localStorage.getItem('kb_last_path');
    return savedPath || defaultPath;
  } catch (error) {
    console.error('Error retrieving path from localStorage:', error);
    return defaultPath;
  }
};

/**
 * Saves session data to localStorage for quick recovery
 */
export const saveSessionData = (session: any): void => {
  try {
    if (!session) return;
    
    // Store minimal session data
    localStorage.setItem('kb_session', JSON.stringify({
      timestamp: Date.now(),
      userId: session.user?.id
    }));
    
    logDebug('Session data saved to localStorage', { userId: session.user?.id }, 'info');
  } catch (error) {
    console.error('Error saving session data:', error);
  }
};

/**
 * Gets saved session data
 */
export const getSavedSessionData = (): { timestamp: number; userId: string } | null => {
  try {
    const data = localStorage.getItem('kb_session');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return null;
  }
};

/**
 * Clears saved session data
 */
export const clearSessionData = (): void => {
  try {
    localStorage.removeItem('kb_session');
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
};
