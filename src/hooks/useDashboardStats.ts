
import { useState, useEffect } from 'react';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { Association } from '@/types/association';
import { User } from '@/types/user';
import { logDebug } from '@/utils/debug';

export interface DashboardStats {
  itemsCount: number;
  categoriesCount: number;
  locationsCount: number;
  conventionsCount: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  handleRetry: () => void;
  unreadNotifications: number;
}

export const useDashboardStats = (
  currentAssociation: Association | null,
  user: User | null
): UseDashboardStatsReturn => {
  const { safeSelect, supabase } = useTypeSafeSupabase();
  
  const [stats, setStats] = useState<DashboardStats>({
    itemsCount: 0,
    categoriesCount: 0,
    locationsCount: 0,
    conventionsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!currentAssociation || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Using a more resilient approach with safeSelect and parallel requests
        const [
          itemsResponse,
          categoriesResponse,
          locationsResponse,
          conventionsResponse,
          notificationsResponse
        ] = await Promise.allSettled([
          // Fetch items count
          safeSelect('items', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch categories count
          safeSelect('categories', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch locations count
          safeSelect('locations', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch conventions count
          safeSelect('conventions', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch unread notifications count
          safeSelect('notifications', '*', { 
            column: 'user_id', 
            value: user.id,
            order: {
              column: 'created_at',
              ascending: false
            }
          })
        ]);
        
        // Process results, handling any failures gracefully
        const itemsCount = itemsResponse.status === 'fulfilled' ? (itemsResponse.value.data?.length || 0) : 0;
        const categoriesCount = categoriesResponse.status === 'fulfilled' ? (categoriesResponse.value.data?.length || 0) : 0;
        const locationsCount = locationsResponse.status === 'fulfilled' ? (locationsResponse.value.data?.length || 0) : 0;
        const conventionsCount = conventionsResponse.status === 'fulfilled' ? (conventionsResponse.value.data?.length || 0) : 0;
        
        setStats({
          itemsCount,
          categoriesCount,
          locationsCount,
          conventionsCount
        });
        
        // Process notifications separately since they may fail
        if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value.data) {
          const unreadCount = notificationsResponse.value.data.filter(n => !n.read).length;
          setUnreadNotifications(unreadCount);
          
          // Log success for debugging
          logDebug('Successfully fetched notifications', {
            total: notificationsResponse.value.data.length,
            unread: unreadCount
          }, 'info');
        } else if (notificationsResponse.status === 'rejected') {
          // Log error for debugging
          logDebug('Failed to fetch notifications', 
            notificationsResponse.reason, 
            'error'
          );
        }
      } catch (error) {
        logDebug('Error fetching dashboard stats:', error, 'error');
        setError('Unable to load dashboard data. Please try again.');
        // We still want to show the dashboard even if stats fail to load
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [currentAssociation, user, retryCount, safeSelect]);
  
  // Set up notification subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time notifications subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // On notification change, just update the unread count
          safeSelect('notifications', '*', {
            column: 'user_id',
            value: user.id
          }).then(({ data }) => {
            if (data) {
              const unreadCount = data.filter(n => !n.read).length;
              setUnreadNotifications(unreadCount);
              logDebug('Updated notification count via realtime', { unreadCount }, 'info');
            }
          }).catch(error => {
            logDebug('Error updating notification count:', error, 'error');
          });
        }
      )
      .subscribe();
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, safeSelect]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    stats,
    isLoading,
    error,
    retryCount,
    handleRetry,
    unreadNotifications
  };
};
