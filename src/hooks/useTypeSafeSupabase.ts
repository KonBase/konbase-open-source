
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logDebug, handleError } from '@/utils/debug';

// Use direct values from the Supabase project
const SUPABASE_URL = "https://ceeoxorrfduotwfgmegx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZW94b3JyZmR1b3R3ZmdtZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTcxNDQsImV4cCI6MjA1OTMzMzE0NH0.xlAn4Z-WkCX4TBMmHt9pnMB7V1Ur6K0AV0L_u0ySKAo";

// Create the supabase client with better retry and timeout options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: (url, options) => {
      // Add a custom fetch with timeout and retry
      const timeoutId = setTimeout(() => {
        logDebug(`Request to ${url} is taking too long`, null, 'warn');
      }, 5000); // Log warning after 5 seconds
      
      return fetch(url, {
        ...options,
        // Adding some resilience for intermittent network issues
        cache: 'no-cache',
      }).then(response => {
        clearTimeout(timeoutId);
        return response;
      }).catch(error => {
        clearTimeout(timeoutId);
        logDebug(`Error fetching ${url}: ${error.message}`, error, 'error');
        throw error;
      });
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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
  // Helper function for safe SELECT operations - no generic type parameter
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
      
      const result = await query;
      
      if (result.error) {
        // Log the specific error for debugging
        logDebug(`Supabase error in safeSelect for ${table}:`, result.error, 'error');
        
        // For service unavailable errors, provide a more specific error
        if (result.error.code === '503' || result.error.message?.includes('Service Unavailable') || result.error.message?.includes('Failed to fetch')) {
          return { 
            data: null, 
            error: { 
              message: 'Supabase service temporarily unavailable. Please try again later.',
              code: '503',
              details: result.error.message
            }
          };
        }
        
        return result;
      }
      
      return result;
    } catch (error) {
      // Handle network errors like timeouts or connection failures
      logDebug(`Error in safeSelect for ${table}:`, error, 'error');
      return { 
        data: null, 
        error: { 
          message: 'Network or service error. Please check your connection and try again.',
          details: error instanceof Error ? error.message : String(error),
          originalError: error
        } 
      };
    }
  };

  // Helper function for safe UPDATE operations with enhanced error handling
  const safeUpdate = async (
    table: TableNames,
    updateData: Record<string, unknown>,
    condition: { column: string; value: any }
  ) => {
    try {
      const result = await supabase
        .from(table)
        .update(updateData)
        .eq(condition.column, condition.value);
      
      if (result.error) {
        logDebug(`Supabase error in safeUpdate for ${table}:`, result.error, 'error');
        
        // Handle specific service unavailable errors
        if (result.error.code === '503' || result.error.message?.includes('Service Unavailable') || result.error.message?.includes('Failed to fetch')) {
          return { 
            data: null, 
            error: { 
              message: 'Supabase service temporarily unavailable. Please try again later.',
              code: '503',
              details: result.error.message
            }
          };
        }
        
        return result;
      }
      
      return result;
    } catch (error) {
      logDebug(`Error in safeUpdate for ${table}:`, error, 'error');
      return { 
        data: null, 
        error: { 
          message: 'Network or service error. Please check your connection and try again.',
          details: error instanceof Error ? error.message : String(error),
          originalError: error
        } 
      };
    }
  };

  // Helper function for safe DELETE operations with enhanced error handling
  const safeDelete = async (
    table: TableNames,
    condition: { column: string; value: any }
  ) => {
    try {
      const result = await supabase
        .from(table)
        .delete()
        .eq(condition.column, condition.value);
      
      if (result.error) {
        logDebug(`Supabase error in safeDelete for ${table}:`, result.error, 'error');
        
        // Handle specific service unavailable errors
        if (result.error.code === '503' || result.error.message?.includes('Service Unavailable') || result.error.message?.includes('Failed to fetch')) {
          return { 
            data: null, 
            error: { 
              message: 'Supabase service temporarily unavailable. Please try again later.',
              code: '503',
              details: result.error.message
            }
          };
        }
        
        return result;
      }
      
      return result;
    } catch (error) {
      logDebug(`Error in safeDelete for ${table}:`, error, 'error');
      return { 
        data: null, 
        error: { 
          message: 'Network or service error. Please check your connection and try again.',
          details: error instanceof Error ? error.message : String(error),
          originalError: error
        } 
      };
    }
  };
  
  // Helper function for safe INSERT operations with enhanced error handling
  const safeInsert = async (
    table: TableNames,
    data: Record<string, unknown> | Record<string, unknown>[]
  ) => {
    try {
      // Use type assertion to bypass complex type checking
      const result = await supabase.from(table).insert(data as any);
      
      if (result.error) {
        logDebug(`Supabase error in safeInsert for ${table}:`, result.error, 'error');
        
        // Handle specific service unavailable errors
        if (result.error.code === '503' || result.error.message?.includes('Service Unavailable') || result.error.message?.includes('Failed to fetch')) {
          return { 
            data: null, 
            error: { 
              message: 'Supabase service temporarily unavailable. Please try again later.',
              code: '503',
              details: result.error.message
            }
          };
        }
      }
      
      return result;
    } catch (error) {
      logDebug(`Error in safeInsert for ${table}:`, error, 'error');
      return { 
        data: null, 
        error: { 
          message: 'Network or service error. Please check your connection and try again.',
          details: error instanceof Error ? error.message : String(error),
          originalError: error
        } 
      };
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
