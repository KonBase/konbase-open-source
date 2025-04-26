// src/hooks/useDemoUserIds.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client'; // Adjust import path if needed
import { logDebug } from '@/utils/debug'; // Optional: for logging

export function useDemoUserIds() {
  const [demoUserIds, setDemoUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDemoUserIds = async () => {
      setLoading(true);
      setError(null);
      try {
        // Example: Fetching from a 'configuration' table
        // Adjust the table name ('configuration'), key column ('key'),
        // value column ('value'), and the specific key ('demo_user_ids') as needed.
        const { data, error: fetchError } = await supabase
          .from('configuration') // Or your specific table/view
          .select('value')
          .eq('key', 'demo_user_ids') // The key identifying the demo user ID list
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Assuming 'value' column stores the array directly
        if (data && Array.isArray(data.value)) {
          setDemoUserIds(data.value as string[]);
           logDebug('Fetched demo user IDs:', data.value);
        } else {
           logDebug('Demo user IDs configuration not found or invalid format', data);
           // Set to empty array if not found or invalid
           setDemoUserIds([]);
           // Optionally, you could throw an error here if the config is mandatory
           // throw new Error('Demo user IDs configuration not found or invalid.');
        }
      } catch (err) {
         logDebug('Error fetching demo user IDs:', err, 'error');
        setError(err instanceof Error ? err : new Error('Failed to fetch demo user IDs'));
        setDemoUserIds([]); // Ensure it's empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchDemoUserIds();
  }, []);

  return { demoUserIds, loading, error };
}