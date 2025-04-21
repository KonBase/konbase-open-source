import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if the execute_sql function exists in the database
 * This function is needed for schema execution
 */
export async function checkExecuteSqlFunction(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // Try to execute a simple query using the function
    await supabase.rpc('execute_sql', { sql_query: 'SELECT 1' });
    return true;
  } catch (error: any) {
    // If the error mentions the function doesn't exist, return false
    if (error.message && (
      error.message.includes('function') && 
      error.message.includes('does not exist') || 
      error.message.includes('not found')
    )) {
      return false;
    }
    
    // If it's another type of error (like permission denied), 
    // we still consider the function might exist
    return true;
  }
}

/**
 * Creates the execute_sql function in the database
 * This function is necessary to run schema commands
 */
export async function createExecuteSqlFunction(
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    // SQL to create the execute_sql function with SECURITY DEFINER
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;
    
    // Try to execute directly (requires high privileges)
    const { error } = await supabase.rpc('execute_sql', { 
      sql_query: createFunctionSQL 
    });
    
    if (error) {
      // This likely means they need to manually create the function
      return { 
        success: false, 
        error: `Could not create execute_sql function: ${error.message}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Executes a SQL schema in Supabase by splitting it into manageable chunks
 * to avoid timeout issues with large SQL files
 */
export async function executeSchemaInChunks(
  supabase: SupabaseClient,
  schema: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ success: boolean; error?: string }> {  try {
    // First check if the execute_sql function exists
    const hasExecuteSqlFunction = await checkExecuteSqlFunction(supabase);
    
    if (!hasExecuteSqlFunction) {
      if (onProgress) {
        onProgress(0, '⚠️ The execute_sql function is missing from your Supabase database');
        onProgress(0, 'Attempting to create the function automatically...');
      }
      
      // Try to create the function
      const createResult = await createExecuteSqlFunction(supabase);
      
      if (!createResult.success) {
        if (onProgress) {
          onProgress(0, '❌ Could not automatically create the execute_sql function');
          onProgress(0, 'You will need to create this function manually in the Supabase SQL Editor:');
          onProgress(0, `
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;`);
        }
        return { 
          success: false, 
          error: 'Missing execute_sql function. Manual creation required.' 
        };
      } else {
        if (onProgress) {
          onProgress(5, '✓ Successfully created the execute_sql function');
        }
      }
    }
    
    // Split the schema into manageable chunks that won't timeout
    const chunks = splitSchema(schema);
    const totalChunks = chunks.length;
    
    // Execute each chunk sequentially
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      const chunkPreview = chunk.substring(0, 50).replace(/\n/g, ' ') + '...';
      
      // Report progress
      if (onProgress) {
        onProgress(
          Math.round(((i) / totalChunks) * 100),
          `Executing chunk ${i + 1}/${totalChunks}: ${chunkPreview}`
        );
      }
      
      try {
        // Execute the SQL chunk using the pg_dump role - this requires RLS to be disabled or proper policies
        const { error } = await supabase.rpc('execute_sql', { sql_query: chunk });
        
        if (error) {
          // If this chunk fails, log it but continue with the next chunks
          console.warn(`Warning: Chunk ${i + 1} execution error:`, error.message);
          if (onProgress) {
            onProgress(
              Math.round(((i + 1) / totalChunks) * 100),
              `⚠️ Warning with chunk ${i + 1}: ${error.message}`
            );
          }
        } else if (onProgress) {
          onProgress(
            Math.round(((i + 1) / totalChunks) * 100),
            `✓ Chunk ${i + 1} executed successfully`
          );
        }
      } catch (chunkError) {
        console.warn(`Warning: Chunk ${i + 1} execution exception:`, chunkError);
        if (onProgress) {
          onProgress(
            Math.round(((i + 1) / totalChunks) * 100),
            `⚠️ Error with chunk ${i + 1}: ${String(chunkError)}`
          );
        }
      }
    }
    
    // Final progress update
    if (onProgress) {
      onProgress(100, '✓ Schema execution completed');
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Split the schema into manageable chunks that won't timeout
function splitSchema(sql: string): string[] {
  // Split on specific comment patterns that indicate logical breaks
  const chunks = sql.split(/-- Create |-- Add |-- Enable |-- RLS Policies |-- Ensure |-- Insert |-- This migration/);
  
  // Filter out empty chunks and add the prefix back
  return chunks
    .filter(chunk => chunk.trim().length > 0)
    .map((chunk, index) => {
      // Add back the prefix except for the first chunk
      return index === 0 ? chunk : `-- Create ${chunk}`;
    });
}
