
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Use direct values from the Supabase project
const SUPABASE_URL = "https://ceeoxorrfduotwfgmegx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZW94b3JyZmR1b3R3ZmdtZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTcxNDQsImV4cCI6MjA1OTMzMzE0NH0.xlAn4Z-WkCX4TBMmHt9pnMB7V1Ur6K0AV0L_u0ySKAo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Helper function to check if using default credentials
export const isUsingDefaultCredentials = () => {
  return !SUPABASE_URL || SUPABASE_URL === "";
};
