
import { createClient } from '@supabase/supabase-js';

// Default values for development - these should be overridden in production
const defaultUrl = 'https://your-project.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with your anon key or a placeholder

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Helper function to check if we're using default values (useful for development)
export const isUsingDefaultCredentials = () => {
  return supabaseUrl === defaultUrl || supabaseAnonKey === defaultAnonKey;
};
