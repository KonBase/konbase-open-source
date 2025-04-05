
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

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

// Helper function to check if using default credentials
export const isUsingDefaultCredentials = () => {
  return !SUPABASE_URL || SUPABASE_URL.includes("example") || SUPABASE_URL.length === 0;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
};

// Helper function to check if the user is authenticated
export const isUserAuthenticated = async () => {
  try {
    const session = await getCurrentSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};
