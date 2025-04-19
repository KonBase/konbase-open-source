import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Progress } from '@/components/ui/progress'; // Added Progress
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert components
import { loadConfig, SupabaseConfig } from '@/lib/config-store';
import { toast } from '@/hooks/use-toast';
import { initializeSupabaseClient } from '@/lib/supabase';
import { Loader2, AlertCircle, CheckCircle, Database } from 'lucide-react'; // Added icons

// Import the schema SQL
import schemaSQL from '../../../schema.sql?raw';

interface DatabaseSchemaSetupProps {
  onNext: () => void; // Changed from onComplete to onNext
}

// Split the schema into manageable chunks that won't timeout
const splitSchema = (sql: string): string[] => {
  // Split on specific comment patterns that indicate logical breaks
  const chunks = sql.split(/-- Create |-- Add |-- Enable |-- RLS Policies |-- Ensure |-- Insert |-- This migration/);
  
  // Filter out empty chunks and add the prefix back
  return chunks
    .filter(chunk => chunk.trim().length > 0)
    .map((chunk, index) => {
      // Add back the prefix except for the first chunk
      return index === 0 ? chunk : `-- Create ${chunk}`;
    });
};

const DatabaseSchemaSetup: React.FC<DatabaseSchemaSetupProps> = ({ onNext }) => {
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);

  useEffect(() => {
    // Load existing config on mount
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  const appendLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };
  
  const executeSchema = async () => {
    // Use config.url and config.key
    if (!config?.url || !config?.key) {
      setError('Supabase credentials not found. Please go back and configure the connection.');
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccess(false);
    setLogs([]);
    
    try {
      // Create a client with the stored credentials
      const supabase = initializeSupabaseClient();

      // Add a more robust check to ensure supabase client is valid and has the 'from' method
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client initialization failed or invalid client returned:', supabase);
        throw new Error('Failed to initialize a valid Supabase client. Check stored configuration and client initialization logic.');
      }

      // Split the schema into manageable chunks
      const schemaChunks = splitSchema(schemaSQL);
      const totalChunks = schemaChunks.length;
      
      appendLog(`Starting schema execution with ${totalChunks} chunks...`);
      
      // Execute each chunk sequentially
      for (let i = 0; i < totalChunks; i++) {
        const chunk = schemaChunks[i];
        // Correctly replace newlines with spaces for the preview
        const chunkPreview = chunk.substring(0, 50).replace(/\n/g, ' ') + '...';

        try {
          appendLog(`Executing chunk ${i + 1}/${totalChunks}: ${chunkPreview}`);

          // Execute the SQL chunk
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.rpc('execute_sql', { sql_query: chunk } as any);

          if (error) {
            // If this chunk fails, log it but continue with the next chunks
            appendLog(`⚠️ Warning: Chunk ${i + 1} execution error: ${error.message}`);
          } else {
            appendLog(`✓ Chunk ${i + 1} executed successfully`);
          }
        } catch (chunkError) {
          appendLog(`⚠️ Warning: Chunk ${i + 1} execution exception: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`);
        }
        
        // Update progress
        const newProgress = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(newProgress);
      }

      // Re-initialize the client specifically for the verification step
      appendLog('Re-initializing client for final verification...');
      const verificationSupabase = initializeSupabaseClient();

      // Add the same robust check for the verification client
      if (!verificationSupabase || typeof verificationSupabase.from !== 'function') {
        console.error('Verification Supabase client initialization failed or invalid client returned:', verificationSupabase);
        throw new Error('Failed to initialize a valid Supabase client for verification. Check stored configuration.');
      }

      // Log the client object right before using it for verification
      console.log('Verification client object right before .from() call:', verificationSupabase);
      appendLog('Verification client initialized. Checking schema...');

      // Final verification check - use the newly initialized client
      const { data, error: verifyError } = await verificationSupabase.from('profiles').select('id').limit(1);

      if (verifyError) {
        appendLog(`❌ Schema verification failed: ${verifyError.message}`);
        throw new Error(`Schema verification failed: ${verifyError.message}`);
      }

      appendLog('✓ Schema verification successful.');
      // Success!
      setSuccess(true);
      appendLog('✓ Schema setup completed successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during schema execution');
      appendLog(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Initialize Database Schema</CardTitle>
        <CardDescription>
          Create the required database tables, functions, and security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          This step will initialize the database schema in your Supabase project. 
          This includes creating all tables, security policies, functions, and triggers 
          needed for KonBase to operate correctly.
        </p>
        
        <div className="py-2">
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-xs text-right mt-1 text-muted-foreground">{progress}% complete</p>
        </div>
        
        {executing && (
          <div className="border rounded-md p-4 bg-muted/40 max-h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">{log}</div>
            ))}
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Schema initialization failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Schema initialized successfully!</AlertTitle>
            <AlertDescription>
              Your database is now ready for KonBase.
            </AlertDescription>
          </Alert>
        )}
        
        {!executing && !success && (
          <Button onClick={executeSchema}>
            <Database className="mr-2 h-4 w-4" />
            Initialize Database Schema
          </Button>
        )}
        
        {executing && (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing Schema...
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          This process may take a minute or two to complete.
        </p>
        <Button
          onClick={onNext} // Changed from onComplete
          disabled={executing || !success}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseSchemaSetup;
