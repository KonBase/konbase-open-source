
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Use direct values from the Supabase project
const SUPABASE_URL = "https://ceeoxorrfduotwfgmegx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZW94b3JyZmR1b3R3ZmdtZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTcxNDQsImV4cCI6MjA1OTMzMzE0NH0.xlAn4Z-WkCX4TBMmHt9pnMB7V1Ur6K0AV0L_u0ySKAo";

// Create the supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});

// Type for our Supabase client
export type TypeSafeSupabaseClient = typeof supabase;

// Define the table names explicitly as a union type
export type TableNames = 
  | 'association_members'
  | 'associations'
  | 'profiles'
  | 'audit_logs'
  | 'backups'
  | 'categories'
  | 'chat_messages'
  | 'convention_access'
  | 'convention_invitations'
  | 'convention_locations'
  | 'conventions'
  | 'documents'
  | 'equipment_set_items'
  | 'equipment_sets'
  | 'item_tags'
  | 'items'
  | 'locations'
  | 'movements'
  | 'notifications'
  | 'requirement_items'
  | 'requirements'
  | 'association_invitations';

// Create a hook for safe Supabase operations
export const useTypeSafeSupabase = () => {
  // Helper function for safe SELECT operations
  const safeSelect = async (
    table: TableNames,
    columns: string = '*',
    queryOptions?: { 
      column?: string; 
      value?: any; 
      limit?: number; 
      order?: { 
        column: string; 
        ascending?: boolean 
      } 
    }
  ) => {
    try {
      let query = supabase.from(table).select(columns);
      
      if (queryOptions?.column && queryOptions?.value !== undefined) {
        query = query.eq(queryOptions.column, queryOptions.value);
      }
      
      if (queryOptions?.limit) {
        query = query.limit(queryOptions.limit);
      }
      
      if (queryOptions?.order) {
        query = query.order(
          queryOptions.order.column, 
          { ascending: queryOptions.order.ascending ?? true }
        );
      }
      
      return await query;
    } catch (error) {
      console.error(`Error in safeSelect for ${table}:`, error);
      return { data: null, error };
    }
  };

  // Helper function for safe UPDATE operations  
  const safeUpdate = async (
    table: TableNames,
    updateData: Record<string, unknown>,
    condition: { column: string; value: any }
  ) => {
    try {
      return await supabase
        .from(table)
        .update(updateData)
        .eq(condition.column, condition.value);
    } catch (error) {
      console.error(`Error in safeUpdate for ${table}:`, error);
      return { data: null, error };
    }
  };
  
  // Helper function for safe DELETE operations
  const safeDelete = async (
    table: TableNames,
    condition: { column: string; value: any }
  ) => {
    try {
      return await supabase
        .from(table)
        .delete()
        .eq(condition.column, condition.value);
    } catch (error) {
      console.error(`Error in safeDelete for ${table}:`, error);
      return { data: null, error };
    }
  };
  
  // Helper function for safe INSERT operations - simplify types to avoid excessive depth
  const safeInsert = async (
    table: TableNames,
    data: Record<string, unknown> | Record<string, unknown>[]
  ) => {
    try {
      // Use type assertion to bypass complex type checking
      const result = await supabase.from(table).insert(data as any);
      
      if (result.error) {
        throw result.error;
      }
      return result;
    } catch (error) {
      console.error(`Error in safeInsert for ${table}:`, error);
      return { data: null, error };
    }
  };

  return {
    supabase,
    safeSelect,
    safeUpdate,
    safeDelete,
    safeInsert
  };
};

// For backward compatibility
export default supabase;
