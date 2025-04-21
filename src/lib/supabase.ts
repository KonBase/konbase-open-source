import { createClient } from '@supabase/supabase-js';
import { loadConfig } from './config-store';

// Store a single instance of the Supabase client
let supabaseClient = null;

// Function to create a client instance - used internally only
const createSupabaseClient = (url, key) => {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: 'konbase-supabase-auth'
    }
  });
};

// Initialize the Supabase client (if not already initialized)
const initClient = () => {
  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // First try to get from config store
  const config = loadConfig();
  if (config?.url && config?.key) {
    console.log('Initializing Supabase client from stored config');
    supabaseClient = createSupabaseClient(config.url, config.key);
    return supabaseClient;
  }
  
  // If no stored config, try environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    console.log('Initializing Supabase client from environment variables');
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  }
  
  console.error('No Supabase credentials found for client');
  return null;
};

// A single exported instance for direct import
export const supabase = initClient();

// This function is for when a new instance is needed (like after config changes)
export const initializeSupabaseClient = () => {
  try {
    // Force client re-initialization
    supabaseClient = null;
    return initClient();
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
};

// Get the existing client or initialize if needed
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    return initClient();
  }
  return supabaseClient;
};
