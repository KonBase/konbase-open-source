
import { useState } from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { logDebug } from '@/utils/debug';
import { supabase } from '@/lib/supabase';
import { Association } from '@/types/association';

export interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

export function useDashboardActivity(currentAssociation: Association | null) {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);

  const { 
    data: recentActivity, 
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity
  } = useSupabaseQuery<AuditLog[]>(
    ['recent-activity', currentAssociation?.id, retryCount],
    async () => {
      if (!currentAssociation?.id) return { data: [] as AuditLog[], error: null };
      
      logDebug(`Fetching recent activity for association ${currentAssociation.id}`, null, 'info');
      
      return await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'associations')
        .eq('entity_id', currentAssociation.id)
        .order('created_at', { ascending: false })
        .limit(5);
    },
    {
      enabled: !!currentAssociation?.id,
      staleTime: 30000,
      onError: (error) => {
        logDebug('Error fetching recent activity', error, 'error');
        setLastError(error);
      }
    }
  );

  const handleRetry = () => {
    logDebug('Manually retrying data fetch', null, 'info');
    setRetryCount(count => count + 1);
    refetchActivity();
  };

  // Ensure recentActivity is always an array
  const safeRecentActivity = Array.isArray(recentActivity?.data) ? recentActivity.data : [];

  return {
    recentActivity,
    isLoadingActivity,
    activityError,
    handleRetry,
    retryCount,
    lastError,
    safeRecentActivity
  };
}
