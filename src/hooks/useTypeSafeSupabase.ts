
import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { handleError, logDebug } from '@/utils/debug';

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

export interface SupabaseQueryOptions {
  column?: string;
  value?: any;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

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

  /**
   * Safe select operation with error handling
   */
  const safeSelect = async (
    table: string,
    columns: string = '*',
    options?: SupabaseQueryOptions
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      let query = supabase.from(table).select(columns);
      
      if (options?.column && options?.value !== undefined) {
        query = query.eq(options.column, options.value);
      }
      
      if (options?.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      handleError(error, `safeSelect.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safe insert operation with error handling
   */
  const safeInsert = async (
    table: string,
    values: Record<string, any>
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      const { data, error } = await supabase.from(table).insert(values).select();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      handleError(error, `safeInsert.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safe update operation with error handling
   */
  const safeUpdate = async (
    table: string,
    values: Record<string, any>,
    filter: { column: string; value: any }
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq(filter.column, filter.value)
        .select();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      handleError(error, `safeUpdate.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safe delete operation with error handling
   */
  const safeDelete = async (
    table: string,
    filter: { column: string; value: any }
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq(filter.column, filter.value);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      handleError(error, `safeDelete.${table}`);
      return { data: null, error };
    }
  };

  return {
    supabase,
    safeSelect,
    safeInsert,
    safeUpdate,
    safeDelete
  };
}

export default useTypeSafeSupabase;
