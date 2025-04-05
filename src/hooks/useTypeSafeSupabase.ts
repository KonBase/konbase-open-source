
import { supabase } from '@/lib/supabase';
import { handleError, logDebug } from '@/utils/debug';

// Define available table names
type TableName = 'profiles' | 'associations' | 'audit_logs' | 'categories' 
  | 'items' | 'locations' | 'chat_messages' | 'notifications' 
  | 'conventions' | 'convention_invitations' | 'association_members';

// Simplified condition type
interface QueryCondition {
  column: string;
  value: any;
}

/**
 * A type-safe Supabase hook for database operations
 */
export function useTypeSafeSupabase() {
  /**
   * Safely select data from a table with proper error handling
   */
  const safeSelect = async <T>(
    table: TableName,
    columns: string = '*',
    condition?: QueryCondition
  ): Promise<{ data: T[] | null; error: any }> => {
    try {
      let query = supabase.from(table).select(columns);
      
      if (condition) {
        query = query.eq(condition.column, condition.value);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return { data: data as T[], error: null };
    } catch (error) {
      handleError(error, `safeSelect.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safely insert data into a table with proper error handling
   */
  const safeInsert = async <T>(
    table: TableName,
    data: any
  ): Promise<{ data: T | null; error: any }> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data: result as T, error: null };
    } catch (error) {
      handleError(error, `safeInsert.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safely update data in a table with proper error handling
   */
  const safeUpdate = async <T>(
    table: TableName,
    updates: any,
    condition: QueryCondition
  ): Promise<{ data: T | null; error: any }> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq(condition.column, condition.value)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data: result as T, error: null };
    } catch (error) {
      handleError(error, `safeUpdate.${table}`);
      return { data: null, error };
    }
  };

  /**
   * Safely delete data from a table with proper error handling
   */
  const safeDelete = async (
    table: TableName,
    condition: QueryCondition
  ): Promise<{ success: boolean; error: any }> => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(condition.column, condition.value);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      handleError(error, `safeDelete.${table}`);
      return { success: false, error };
    }
  };

  return {
    safeSelect,
    safeInsert,
    safeUpdate,
    safeDelete
  };
}
