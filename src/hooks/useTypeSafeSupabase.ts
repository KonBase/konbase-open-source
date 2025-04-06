
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { handleError, logDebug } from '@/utils/debug';

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
  /**
   * Safe select operation with error handling
   */
  const safeSelect = async (
    table: string,
    columns: string = '*',
    options?: SupabaseQueryOptions
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
  const safeInsert = async (
    table: string,
    values: Record<string, any>
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
  const safeUpdate = async (
    table: string,
    values: Record<string, any>,
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
  const safeDelete = async (
    table: string,
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
