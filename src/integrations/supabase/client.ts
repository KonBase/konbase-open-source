
// This file creates a Supabase client using configuration from localStorage or defaults
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { loadConfig, isConfigured } from '@/lib/config-store';

// Default values - these will be used only if no configuration exists in localStorage
const DEFAULT_SUPABASE_URL = "";
const DEFAULT_SUPABASE_KEY = "";

// Get values from localStorage config if available
const config = loadConfig();
const SUPABASE_URL = config?.url || DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = config?.key || DEFAULT_SUPABASE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Export a function to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured() && !!SUPABASE_URL && !!SUPABASE_PUBLISHABLE_KEY;
