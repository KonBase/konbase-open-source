
import { useState, useEffect, useCallback } from 'react';
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
  requestTimestamp: number | null;
  responseTimestamp: number | null;
  errorDetails: any | null;
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
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [requestTimestamp, setRequestTimestamp] = useState<number | null>(null);
  const [responseTimestamp, setResponseTimestamp] = useState<number | null>(null);
  
  // Separated fetchDashboardStats as a useCallback function for better debugging
  const fetchDashboardStats = useCallback(async () => {
    if (!currentAssociation || !user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setRequestTimestamp(Date.now());
    
    try {
      logDebug('Starting dashboard stats fetch', { 
        associationId: currentAssociation.id,
        userId: user.id,
        retryCount,
        timestamp: new Date().toISOString()
      }, 'info');
      
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
      
      // Detailed debugging of responses
      const responses = {
        items: itemsResponse,
        categories: categoriesResponse,
        locations: locationsResponse,
        conventions: conventionsResponse,
        notifications: notificationsResponse
      };
      
      logDebug('Dashboard stats fetch responses', responses, 'debug');
      
      // Track failed requests
      const failedRequests = Object.entries(responses).filter(
        ([_, response]) => response.status === 'rejected'
      );
      
      if (failedRequests.length > 0) {
        logDebug('Some dashboard stat requests failed', failedRequests, 'warn');
      }
      
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
      
      // Check if all requests failed, which indicates a more serious issue
      const allRequestsFailed = Object.values(responses).every(
        response => response.status === 'rejected'
      );
      
      if (allRequestsFailed) {
        // Get the first error to display
        const firstError = Object.values(responses)[0] as PromiseRejectedResult;
        throw new Error(
          firstError.reason?.message || 
          'All data requests failed. Please check your network connection.'
        );
      }
      
      setResponseTimestamp(Date.now());
      logDebug('Dashboard stats fetch completed successfully', {
        stats: { itemsCount, categoriesCount, locationsCount, conventionsCount },
        duration: Date.now() - (requestTimestamp || 0)
      }, 'info');
      
    } catch (error: any) {
      setResponseTimestamp(Date.now());
      logDebug('Error fetching dashboard stats:', error, 'error');
      
      // Detailed error handling
      let errorMessage = 'Unable to load dashboard data. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('code' in error && 'message' in error) {
          errorMessage = `${error.message} (Code: ${error.code})`;
        } else if ('message' in error) {
          errorMessage = error.message as string;
        }
      }
      
      // Save detailed error for debugging UI
      setErrorDetails(error);
      setError(errorMessage);
      
      // Additional network diagnostics
      if (!navigator.onLine) {
        errorMessage = 'You are offline. Please check your internet connection.';
        setError(errorMessage);
      }
      
    } finally {
      setIsLoading(false);
    }
  }, [currentAssociation, user, retryCount, safeSelect, requestTimestamp]);

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);
  
  // Set up notification subscription
  useEffect(() => {
    if (!user) return;
    
    logDebug('Setting up notifications subscription', { userId: user.id }, 'debug');
    
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
        (payload) => {
          // On notification change, log the event and update count
          logDebug('Received notification change via realtime', payload, 'info');
          
          // Update the unread count
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
      .subscribe((status) => {
        logDebug('Notification subscription status', status, 'info');
      });
    
    // Return cleanup function
    return () => {
      logDebug('Cleaning up notifications subscription', null, 'debug');
      supabase.removeChannel(channel);
    };
  }, [user, supabase, safeSelect]);

  const handleRetry = useCallback(() => {
    logDebug('Manual retry requested', { retryCount: retryCount + 1 }, 'info');
    setRetryCount(prev => prev + 1);
  }, [retryCount]);

  return {
    stats,
    isLoading,
    error,
    retryCount,
    handleRetry,
    unreadNotifications,
    requestTimestamp,
    responseTimestamp,
    errorDetails
  };
};
