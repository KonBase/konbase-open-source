import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { logDebug, handleError } from '@/utils/debug';

// Use direct values from the Supabase project
const SUPABASE_URL = "https://ceeoxorrfduotwfgmegx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZW94b3JyZmR1b3R3ZmdtZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTcxNDQsImV4cCI6MjA1OTMzMzE0NH0.xlAn4Z-WkCX4TBMmHt9pnMB7V1Ur6K0AV0L_u0ySKAo";

// Create a stable Supabase client instance with consistent configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
  supabase,
  getCurrentSession,
  isUserAuthenticated,
  handleSupabaseError,
  safeSupabaseOperation
};
