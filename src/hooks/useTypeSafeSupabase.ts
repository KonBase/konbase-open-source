
import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// Define a simplified version of the Database type to avoid deep recursion
type SimplifiedDatabase = {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useTypeSafeSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient<SimplifiedDatabase> | null>(null);
  
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not set');
      return;
    }
    
    const client = createClient<SimplifiedDatabase>(supabaseUrl, supabaseAnonKey);
    setSupabase(client);
    
    return () => {
      // No cleanup needed for Supabase client
    };
  }, []);
  
  return supabase;
}

export default useTypeSafeSupabase;
