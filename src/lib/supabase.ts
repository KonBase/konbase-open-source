import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
// Import the actual exported functions
import { loadConfig, isConfigured } from './config-store';

let supabaseInstance: SupabaseClient<Database> | null = null;

// Function to get the Supabase client instance, returns null if not configured or setup not complete
export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  // Return existing client if already initialized
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Get config and setup status using the actual exported functions
  const config = loadConfig();
  const setupCompleted = isConfigured(); // Or check config?.configured

  // If configuration is missing, or keys/url are missing, or not marked configured, return null
  if (!config || !config.url || !config.key || !setupCompleted) {
    // console.warn('Supabase configuration is missing or setup not complete.');
    return null;
  }

  // Initialize the client only if configuration is present and setup is complete
  try {
    // console.log('Initializing Supabase client with:', config.url);
    // Use config.url and config.key from the loaded config
    supabaseInstance = createClient<Database>(config.url, config.key);
    return supabaseInstance;
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    supabaseInstance = null; // Ensure client is null on error
    return null;
  }
};

// Function to explicitly initialize or re-initialize the client
// This can be called after setup is complete
export const initializeSupabaseClient = (): SupabaseClient<Database> | null => {
  supabaseInstance = null; // Reset existing client if any
  return getSupabaseClient(); // Attempt to get/create client with current config
};

// Export the instance directly for easier import, initializing it on first access
export const supabase = getSupabaseClient();
