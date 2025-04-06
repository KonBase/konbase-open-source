
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError, logDebug } from '@/utils/debug';
import { useState, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

// Implement a custom hook for fetching dashboard activity data
export const useDashboardActivity = (currentAssociation: any) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);
  const [requestTimestamp, setRequestTimestamp] = useState<number | null>(null);
  const [responseTimestamp, setResponseTimestamp] = useState<number | null>(null);
  const { profile } = useUserProfile();
  
  // Is the user an admin
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'system_admin';

  // Query to fetch recent activity data
  const { 
    data: activityData, 
    error: activityError, 
    isLoading: activityLoading, 
    refetch: refetchActivity 
  } = useQuery({
    queryKey: ['dashboard-activity', currentAssociation?.id],
    queryFn: async () => {
      try {
        // Log the query start
        setRequestTimestamp(Date.now());
        logDebug('Fetching dashboard activity', {associationId: currentAssociation?.id}, 'info');
        
        // Skip query if no association is selected
        if (!currentAssociation?.id) {
          logDebug('No association selected, skipping activity fetch', null, 'info');
          return [];
        }
        
        // Fetch recent activity data (last 30 days)
        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('entity', 'association')
          .eq('entity_id', currentAssociation.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: activityData, error: activityError } = await query;
        
        setResponseTimestamp(Date.now());
        
        if (activityError) {
          setLastError(activityError);
          throw activityError;
        }
        
        return activityData;
      } catch (error) {
        setResponseTimestamp(Date.now());
        setLastError(error);
        handleError(error, 'useDashboardActivity.fetchActivity');
        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: isAdmin, // Only auto-refresh for admins
    enabled: !!currentAssociation?.id,
    retry: 1, // Limit retries to prevent excessive queries
  });
  
  // Safe getter for activity data with error checking
  const safeRecentActivity = useCallback(() => {
    if (activityError) {
      logDebug('Error fetching recent activity', activityError, 'error');
      return [];
    }
    
    // Check if we have valid data
    if (activityData && Array.isArray(activityData)) {
      return activityData;
    }
    
    return [];
  }, [activityData, activityError]);
  
  // Function to handle retry with tracking
  const handleRetry = useCallback(() => {
    logDebug('Manually retrying activity fetch', {retryCount: retryCount + 1}, 'info');
    setRetryCount(prev => prev + 1);
    setRequestTimestamp(Date.now());
    setResponseTimestamp(null);
    return refetchActivity();
  }, [refetchActivity, retryCount]);
  
  return {
    activityData,
    activityError,
    activityLoading,
    refetchActivity,
    handleRetry,
    retryCount,
    lastError,
    safeRecentActivity,
    isLoadingActivity: activityLoading,
    requestInfo: {
      requestTimestamp,
      responseTimestamp,
      retryCount
    }
  };
};
