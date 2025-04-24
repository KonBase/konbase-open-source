import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/auth'; // Corrected import path
import { logDebug } from '@/utils/debug';
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
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null); // Initialize as null
  const [loadingDuration, setLoadingDuration] = useState(0);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const networkStatus = useNetworkStatus({
    showToasts: true,
    testInterval: 30000,
    testEndpoint: 'https://www.google.com'
  });

  const {
    activityData,
    activityError,
    activityLoading,
    handleRetry,
    retryCount,
    lastError,
    safeRecentActivity,
    isLoadingActivity,
    requestInfo
  } = useDashboardActivity(currentAssociation);

  // Track loading duration
  useEffect(() => {
    const isLoading = associationLoading || activityLoading;

    if (isLoading) {
      if (loadingTimerRef.current === null) {
        const startTime = Date.now();
        setLoadingStartTime(startTime); // Set start time only once when loading begins
        loadingTimerRef.current = setInterval(() => {
          setLoadingDuration(Date.now() - startTime);
        }, 100);
      }
    } else {
      if (loadingTimerRef.current !== null) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
        // Calculate final duration when loading stops
        const finalDuration = loadingStartTime ? Date.now() - loadingStartTime : 0;
        setLoadingDuration(finalDuration);

        // Show toast with loading stats if debug mode is on
        if (isDebugMode && finalDuration > 0) {
          toast({
            title: "Dashboard loading completed",
            description: `Loaded in ${finalDuration}ms. Network: ${networkStatus.status}`,
            variant: "default",
          });
        }
        // Reset start time for the next loading cycle
        setLoadingStartTime(null);
      }
    }

    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null; // Ensure cleanup on unmount
      }
    };
  }, [associationLoading, activityLoading, isDebugMode, networkStatus.status, toast]); // Remove loadingStartTime from dependencies

  // Log state changes, avoiding excessive logging due to object references or rapid duration changes
  useEffect(() => {
    logDebug('Dashboard component state changed', {
      associationLoading,
      user: user?.id, // Use stable ID
      associationId: currentAssociation?.id, // Use stable ID
      networkStatus: networkStatus.status,
      retryCount,
      // loadingDuration is removed to prevent logging on every interval tick
    }, 'info');
    // Dependencies: Use stable IDs and values that indicate significant state changes
  }, [associationLoading, user?.id, currentAssociation?.id, networkStatus.status, retryCount]);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newValue = !prev;
      logDebug(`Debug mode ${newValue ? 'enabled' : 'disabled'} by user`, null, 'info');
      return newValue;
    });
  }, []); // Remove isDebugMode from dependencies to prevent infinite loop

  const handleShowLocationManager = useCallback(() => {
    setShowLocationManager(true);
  }, []);

  const handleBackFromLocationManager = useCallback(() => {
    setShowLocationManager(false);
  }, []);

  // If loading takes too long, show warning in debug mode
  useEffect(() => {
    // Only show the toast if loading is actively ongoing
    const isLoading = associationLoading || activityLoading;
    if (isLoading && loadingDuration > 5000 && isDebugMode) {
      toast({
        title: "Loading is taking longer than usual",
        description: `Current duration: ${Math.round(loadingDuration / 1000)}s. Network: ${networkStatus.status}`,
        variant: "warning",
      });
    }
    // Dependencies: loadingDuration, debug mode, loading state flags, network status, toast
  }, [loadingDuration, isDebugMode, associationLoading, activityLoading, networkStatus.status, toast]);

  // Loading state
  if (associationLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardLoading
          networkStatus={networkStatus.status}
          loadingDuration={loadingDuration}
          isDebugMode={isDebugMode}
        />
        {isDebugMode && (
          <DebugPanel
            networkStatus={networkStatus.status}
            testConnection={networkStatus.testConnection}
            isTestingConnection={networkStatus.isTestingConnection}
            lastTestedAt={networkStatus.lastTestedAt}
            testResults={networkStatus.testResults}
            userData={{
              userId: user?.id,
              associationId: currentAssociation?.id
            }}
            requestInfo={{
              requestTimestamp: requestInfo?.requestTimestamp,
              responseTimestamp: requestInfo?.responseTimestamp,
              retryCount: retryCount
            }}
          />
        )}
      </div>
    );
  }

  // Error state
  if (activityError) {
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

  // No association state
  if (!currentAssociation) {
    return (
      <DashboardEmptyState
        networkStatus={networkStatus}
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
        user={user}
        currentAssociation={currentAssociation}
        handleRetry={handleRetry}
        lastError={lastError}
        retryCount={retryCount}
      />
    );
  }

  // Location manager view
  if (showLocationManager) {
    return (
      <DashboardLocationView
        currentAssociation={currentAssociation}
        onBack={handleBackFromLocationManager}
      />
    );
  }

  // Main dashboard view
  return (
    <DashboardContent
      currentAssociation={currentAssociation}
      user={user}
      isLoadingActivity={isLoadingActivity}
      safeRecentActivity={safeRecentActivity}
      activityError={activityError}
      handleRetry={handleRetry}
      onShowLocationManager={handleShowLocationManager}
      isDebugMode={isDebugMode}
      toggleDebugMode={toggleDebugMode}
      networkStatus={networkStatus}
      lastError={lastError}
      retryCount={retryCount}
      loadTime={loadingDuration} // Pass the final calculated duration
      requestInfo={requestInfo}
    />
  );
};

export default Dashboard;
