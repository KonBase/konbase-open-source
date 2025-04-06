
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError, logDebug } from '@/utils/debug';

// Implement a custom hook for fetching dashboard activity data
export const useDashboardActivity = () => {
  // Query to fetch recent activity data
  const { 
    data: activityData, 
    error: activityError, 
    isLoading: activityLoading, 
    refetch: refetchActivity 
  } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      try {
        // Log the query start
        logDebug('Fetching dashboard activity', null, 'info');
        
        // Fetch recent activity data (last 30 days)
        const { data: activityData, error: activityError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (activityError) throw activityError;
        
        return activityData;
      } catch (error) {
        handleError(error, 'useDashboardActivity.fetchActivity');
        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true
  });
  
  // Safe getter for activity data with error checking
  const safeRecentActivity = () => {
    if (activityError) {
      logDebug('Error fetching recent activity', activityError, 'error');
      return [];
    }
    
    // Check if we have valid data
    if (activityData && Array.isArray(activityData)) {
      return activityData;
    }
    
    return [];
  };
  
  return {
    activityData: safeRecentActivity(),
    activityError,
    activityLoading,
    refetchActivity
  };
};
