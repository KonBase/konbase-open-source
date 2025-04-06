
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logDebug, handleError } from '@/utils/debug';

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
