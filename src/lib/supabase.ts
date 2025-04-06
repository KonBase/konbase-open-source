
// Re-export the Supabase client from the integrations folder
export { supabase } from '@/integrations/supabase/client';

import { logDebug, handleError } from '@/utils/debug';
import { supabase } from '@/integrations/supabase/client';

// Enhanced error handling and diagnostic logging
const logSupabaseActivity = (operation: string, details: any = null, level: 'info' | 'warn' | 'error' = 'info') => {
  logDebug(`Supabase [${operation}]`, details, level);
};

// Add connection status logging
supabase.auth.onAuthStateChange((event, session) => {
  logSupabaseActivity('Auth state change', { event, userId: session?.user?.id }, 'info');
});

// Ping Supabase to check connection on startup
(async () => {
  try {
    const start = performance.now();
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    const duration = Math.round(performance.now() - start);
    
    if (error) {
      logSupabaseActivity('Initial connection check failed', error, 'error');
    } else {
      logSupabaseActivity('Initial connection successful', { durationMs: duration }, 'info');
    }
  } catch (error) {
    logSupabaseActivity('Initial connection check exception', error, 'error');
  }
})();

// Add event listeners for connection status
if (typeof window !== 'undefined') {
  // Log when connection is established or lost
  window.addEventListener('online', () => {
    logDebug('Network connection restored', null, 'info');
  });
  
  window.addEventListener('offline', () => {
    logDebug('Network connection lost', null, 'warn');
  });
}

// Get constants from the client
const { SUPABASE_URL } = (() => {
  // Access the Supabase URL directly from the integrations file
  return {
    SUPABASE_URL: "https://ecvsnnfdaqjnbcpvxlly.supabase.co"
  };
})();

// Helper function to check if using default credentials
export const isUsingDefaultCredentials = () => {
  return !SUPABASE_URL || SUPABASE_URL.includes("example") || SUPABASE_URL.length === 0;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  try {
    logDebug('Getting current session', null, 'info');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      handleError(error, 'getCurrentSession');
      return null;
    }
    return data.session;
  } catch (error) {
    handleError(error, 'getCurrentSession');
    return null;
  }
};

// Helper function to check if the user is authenticated
export const isUserAuthenticated = async () => {
  try {
    const session = await getCurrentSession();
    const authenticated = !!session;
    logDebug(`Authentication check: ${authenticated ? 'authenticated' : 'not authenticated'}`, null, 'info');
    return authenticated;
  } catch (error) {
    handleError(error, 'isUserAuthenticated');
    return false;
  }
};

// Enhanced error handling for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  let message = 'An error occurred';
  
  if (error && typeof error === 'object') {
    if ('code' in error && 'message' in error) {
      message = `${error.message} (code: ${error.code})`;
    } else if ('message' in error) {
      message = error.message as string;
    }
  }
  
  logDebug(`Supabase error in ${operation}: ${message}`, error, 'error');
  return message;
};

// Wrapper for Supabase operations with error handling
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await operation();
    
    if (error) {
      const errorMessage = handleSupabaseError(error, operationName);
      return { data: null, error: errorMessage };
    }
    
    return { data, error: null };
  } catch (error) {
    const errorMessage = handleError(error, `safeSupabaseOperation.${operationName}`);
    return { data: null, error: errorMessage };
  }
};

export default {
  getCurrentSession,
  isUserAuthenticated,
  handleSupabaseError,
  safeSupabaseOperation
};
