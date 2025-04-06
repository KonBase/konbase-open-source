
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now());
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
    if (associationLoading || activityLoading) {
      if (!loadingTimerRef.current) {
        setLoadingStartTime(Date.now());
        loadingTimerRef.current = setInterval(() => {
          setLoadingDuration(Date.now() - loadingStartTime);
        }, 100);
      }
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      // Final loading duration
      setLoadingDuration(Date.now() - loadingStartTime);
      
      // Show toast with loading stats if debug mode is on
      if (isDebugMode && loadingDuration > 0) {
        toast({
          title: "Dashboard loading completed",
          description: `Loaded in ${loadingDuration}ms. Network: ${networkStatus.status}`,
          variant: "default",
        });
      }
    }
    
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, [associationLoading, activityLoading, loadingStartTime, isDebugMode, loadingDuration, networkStatus.status, toast]);
  
  useEffect(() => {
    logDebug('Dashboard component state', {
      associationLoading,
      user: user?.id,
      associationId: currentAssociation?.id,
      networkStatus: networkStatus.status,
      retryCount,
      loadingDuration
    }, 'info');
  }, [associationLoading, user, currentAssociation, networkStatus.status, retryCount, loadingDuration]);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
    logDebug(`Debug mode ${!isDebugMode ? 'enabled' : 'disabled'} by user`, null, 'info');
  }, [isDebugMode]);

  const handleShowLocationManager = useCallback(() => {
    setShowLocationManager(true);
  }, []);

  const handleBackFromLocationManager = useCallback(() => {
    setShowLocationManager(false);
  }, []);

  // If loading takes too long, show warning in debug mode
  useEffect(() => {
    if (loadingDuration > 5000 && isDebugMode && (associationLoading || activityLoading)) {
      toast({
        title: "Loading is taking longer than usual",
        description: `Current duration: ${Math.round(loadingDuration / 1000)}s. Network: ${networkStatus.status}`,
        variant: "warning",
      });
    }
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
      safeRecentActivity={safeRecentActivity()}
      activityError={activityError}
      handleRetry={handleRetry}
      onShowLocationManager={handleShowLocationManager}
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
