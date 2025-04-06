
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { handleError, logDebug } from '@/utils/debug';
import { Database } from '@/lib/database.types';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

// Define available tables from our database schema to provide better type safety
export type Tables = keyof Database['public']['Tables'];

export interface SupabaseQueryOptions<T extends Tables> {
  column?: string;
  value?: any;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

export function useTypeSafeSupabase() {
  /**
   * Safe select operation with error handling
   */
  const safeSelect = async <T extends Tables>(
    table: T,
    columns: string = '*',
    options?: SupabaseQueryOptions<T>
  ) => {
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
  const safeInsert = async <T extends Tables>(
    table: T,
    // Use proper typing for the values parameter
    values: Database['public']['Tables'][T]['Insert']
  ) => {
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
  const safeUpdate = async <T extends Tables>(
    table: T,
    // Use proper typing for the values parameter
    values: Database['public']['Tables'][T]['Update'],
    filter: { column: string; value: any }
  ) => {
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
  const safeDelete = async <T extends Tables>(
    table: T,
    filter: { column: string; value: any }
  ) => {
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
