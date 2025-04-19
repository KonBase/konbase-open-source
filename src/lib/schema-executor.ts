import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Executes a SQL schema in Supabase by splitting it into manageable chunks
 * to avoid timeout issues with large SQL files
 */
export async function executeSchemaInChunks(
  supabase: SupabaseClient,
  schema: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
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
