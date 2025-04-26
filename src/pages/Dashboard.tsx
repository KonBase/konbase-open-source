import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/auth';
import { logDebug, isDebugModeEnabled, enableDebugMode } from '@/utils/debug';
import { useDashboardActivity } from '@/hooks/useDashboardActivity';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLocationView from '@/components/dashboard/DashboardLocationView';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DebugPanel from '@/utils/debug-panel';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const { user } = useAuth();
  
  // Initialize debug mode state from localStorage ONCE
  const [isDebugMode, setIsDebugMode] = useState(() => isDebugModeEnabled());
  
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingDuration, setLoadingDuration] = useState(0);
  const loadingTimerRef = useRef<number | null>(null);
  const dataLoadingAttempted = useRef(false);
  const loadingTimeUpdateInterval = useRef<number>(100); // Update loading time every 100ms instead of every frame
  const lastLoadingUpdateTime = useRef<number>(0);
  const { toast } = useToast();

  // Configure network status monitoring - FIXED: Don't wrap hook in useMemo
  // This was causing the "Should have a queue" React error
  const networkStatus = useNetworkStatus({
    showToasts: false,
    // Only enable periodic checks in debug mode
    testInterval: isDebugMode ? 30000 : 0,
    testEndpoint: 'https://www.google.com',
    respectDebugMode: true
  });

  const {
    activityData,
    activityError,
    activityLoading,
    handleRetry,
    retryCount,
    lastError,
    requestInfo,
  } = useDashboardActivity(currentAssociation);

  // Memoize safe version of activity data to avoid unnecessary re-renders
  const safeRecentActivity = useMemo(() => activityData || [], [activityData]);

  // Toggle debug mode with consistent localStorage update
  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newValue = !prev;
      enableDebugMode(newValue); // Update localStorage
      return newValue;
    });
  }, []);

  // Track loading duration with optimized performance
  useEffect(() => {
    const isLoading = associationLoading || activityLoading;

    if (isLoading) {
      if (loadingTimerRef.current === null && loadingStartTime === null) {
        // Start tracking loading time
        const startTime = performance.now();
        setLoadingStartTime(startTime);
        
        // Use more efficient animation frame handling with throttling
        const updateLoadingDuration = () => {
          if (loadingStartTime !== null) {
            const now = performance.now();
            // Only update state if enough time has passed (throttle updates)
            if (now - lastLoadingUpdateTime.current > loadingTimeUpdateInterval.current) {
              const currentDuration = now - loadingStartTime;
              setLoadingDuration(currentDuration);
              lastLoadingUpdateTime.current = now;
            }
            loadingTimerRef.current = requestAnimationFrame(updateLoadingDuration);
          }
        };
        
        loadingTimerRef.current = requestAnimationFrame(updateLoadingDuration);
      }
    } else if (!isLoading && loadingStartTime !== null) {
      // We're done loading, calculate final duration
      const finalDuration = performance.now() - loadingStartTime;
      
      if (loadingTimerRef.current !== null) {
        cancelAnimationFrame(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      // Only show load time notification if debug mode is on
      if (isDebugMode) {
        // Log performance metrics in debug mode only
        logDebug('Dashboard loading performance', {
          loadTime: finalDuration,
          networkStatus: networkStatus.status,
          retryCount
        }, 'info');
      }
      
      // Mark that data has been loaded at least once
      dataLoadingAttempted.current = true;
      
      // Set final duration
      setLoadingDuration(finalDuration);
      
      // Reset start time for the next loading cycle
      setLoadingStartTime(null);
    }

    return () => {
      if (loadingTimerRef.current !== null) {
        cancelAnimationFrame(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [associationLoading, activityLoading, isDebugMode, networkStatus.status, retryCount, loadingStartTime]);

  // Listen for dashboard reload requests from navigation events - only add once
  // Using a ref to prevent unnecessary reattachment of event listener
  const handleRetryRef = useRef(handleRetry);
  const activityLoadingRef = useRef(activityLoading);
  
  useEffect(() => {
    handleRetryRef.current = handleRetry;
    activityLoadingRef.current = activityLoading;
  }, [handleRetry, activityLoading]);
  
  useEffect(() => {
    const handleDashboardReloadRequest = () => {
      // Force a retry on the dashboard data
      if (!activityLoadingRef.current) {
        handleRetryRef.current();
      }
    };

    window.addEventListener('dashboard-reload-requested', handleDashboardReloadRequest);
    
    return () => {
      window.removeEventListener('dashboard-reload-requested', handleDashboardReloadRequest);
    };
  }, []); // Empty dependency array since we're using refs

  // Derived values
  const isLoading = associationLoading || activityLoading;

  // Loading state
  if (associationLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardLoading
          networkStatus={networkStatus.status}
          loadingDuration={loadingDuration}
          isDebugMode={isDebugMode}
          retryCount={retryCount}
        />
        {isDebugMode && (
          <DebugPanel
            networkStatus={networkStatus.status}
            testConnection={networkStatus.testConnection}
            isTestingConnection={networkStatus.isTestingConnection}
          />
        )}
      </div>
    );
  }

  // Error state
  if (activityError && !activityLoading) {
    return (
      <DashboardError 
        error={activityError}
        handleRetry={handleRetry}
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
        networkStatus={networkStatus}
        user={user}
        currentAssociation={currentAssociation}
        lastError={lastError}
        retryCount={retryCount}
      />
    );
  }

  // Empty state - no association selected
  if (!currentAssociation) {
    return (
      <DashboardEmptyState 
        networkStatus={networkStatus}
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
        user={user}
        currentAssociation={null}
        handleRetry={handleRetry}
        lastError={lastError}
        retryCount={retryCount}
      />
    );
  }

  // Location manager modal
  if (showLocationManager) {
    return (
      <DashboardLocationView
        currentAssociation={currentAssociation}
        onBack={() => setShowLocationManager(false)}
      />
    );
  }

  // Main dashboard content
  return (
    <DashboardContent
      currentAssociation={currentAssociation}
      user={user}
      isLoadingActivity={activityLoading}
      safeRecentActivity={safeRecentActivity}
      activityError={activityError}
      handleRetry={handleRetry}
      onShowLocationManager={() => setShowLocationManager(true)}
      isDebugMode={isDebugMode}
      toggleDebugMode={toggleDebugMode}
      networkStatus={networkStatus}
      lastError={lastError}
      retryCount={retryCount}
      loadTime={loadingDuration}
      requestInfo={requestInfo}
    />
  );
};

export default Dashboard;
