
import { useState, useEffect, useCallback } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { handleError } from '@/utils/debug';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface DashboardData {
  itemCount: number;
  categoryCount: number;
  locationCount: number;
  conventionCount: number;
  recentNotifications: {
    id: string;
    title: string;
    message: string;
    created_at: string;
  }[];
}

interface UseDashboardStatsOptions {
  onRequestStart?: () => void;
  onRequestEnd?: () => void;
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { onRequestStart, onRequestEnd } = options;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { currentAssociation } = useAssociation();
  const { safeSelect } = useTypeSafeSupabase();
  const { isOnline } = useNetworkStatus();
  const [loadAttempted, setLoadAttempted] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!currentAssociation) {
      setDashboardData(null);
      setIsLoading(false);
      setLoadAttempted(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Signal request start
    if (onRequestStart) onRequestStart();

    try {
      const associationId = currentAssociation.id;
      // Get the current user ID - using auth context or from the profile/user object
      const userId = currentAssociation.profile?.id || null;
      
      // Using Promise.allSettled to handle partial failures gracefully
      const responses = await Promise.allSettled([
        // Items count
        safeSelect(
          'items',
          '*',
          { column: 'association_id', value: associationId }
        ),
        
        // Categories count
        safeSelect(
          'categories',
          '*',
          { column: 'association_id', value: associationId }
        ),
        
        // Locations count
        safeSelect(
          'locations',
          '*',
          { column: 'association_id', value: associationId }
        ),
        
        // Conventions count
        safeSelect(
          'conventions',
          '*',
          { column: 'association_id', value: associationId }
        ),
        
        // Notifications - only fetch if we have a userId
        userId ? safeSelect(
          'notifications',
          '*',
          { 
            column: 'user_id', 
            value: userId,
            order: { column: 'created_at', ascending: false },
            limit: 5
          }
        ) : Promise.resolve({ data: [], error: null }),
      ]);
      
      console.debug('Dashboard stats fetch responses', {
        items: responses[0],
        categories: responses[1],
        locations: responses[2],
        conventions: responses[3],
        notifications: responses[4]
      });
      
      // Check for errors in any of the requests
      const anyErrors = responses.some(response => 
        response.status === 'rejected' || 
        (response.status === 'fulfilled' && response.value.error)
      );
      
      if (anyErrors) {
        // Find the first error to show
        const firstError = responses.find(response => 
          response.status === 'rejected' || 
          (response.status === 'fulfilled' && response.value.error)
        );
        
        if (firstError?.status === 'rejected') {
          throw firstError.reason;
        } else if (firstError?.status === 'fulfilled') {
          throw (firstError.value as any).error;
        }
      }
      
      // All requests successful, extract data
      const data: DashboardData = {
        itemCount: (responses[0].status === 'fulfilled' && responses[0].value.data) 
          ? responses[0].value.data.length 
          : 0,
        categoryCount: (responses[1].status === 'fulfilled' && responses[1].value.data) 
          ? responses[1].value.data.length 
          : 0,
        locationCount: (responses[2].status === 'fulfilled' && responses[2].value.data) 
          ? responses[2].value.data.length 
          : 0,
        conventionCount: (responses[3].status === 'fulfilled' && responses[3].value.data) 
          ? responses[3].value.data.length 
          : 0,
        recentNotifications: (responses[4].status === 'fulfilled' && responses[4].value.data) 
          ? responses[4].value.data 
          : [],
      };
      
      setDashboardData(data);
      setLoadAttempted(true);
    } catch (err) {
      handleError(err, 'fetchDashboardData');
      setError(err);
      setLoadAttempted(true);
    } finally {
      setIsLoading(false);
      // Signal request end
      if (onRequestEnd) onRequestEnd();
    }
  }, [currentAssociation, safeSelect, onRequestStart, onRequestEnd]);

  useEffect(() => {
    // Only fetch if online and we have an association
    if (isOnline && currentAssociation && !loadAttempted) {
      fetchDashboardData();
    }
  }, [isOnline, currentAssociation, fetchDashboardData, loadAttempted]);

  // Reset load attempted when association changes
  useEffect(() => {
    setLoadAttempted(false);
  }, [currentAssociation?.id]);

  return {
    dashboardData,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}
