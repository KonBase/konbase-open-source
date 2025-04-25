import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Track when we've shown the slow loading warning to avoid duplicate notifications
  const hasShownSlowLoadingWarningRef = useRef(false);
  
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingDuration, setLoadingDuration] = useState(0);
  const loadingTimerRef = useRef<number | null>(null);
  const checkDebugModeTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Configure network status monitoring with optimized settings
  const networkStatus = useNetworkStatus({
    showToasts: isDebugMode, // Only show network status toasts in debug mode
    testInterval: isDebugMode ? 30000 : 300000, // Dramatically reduce tests when debug is off
    testEndpoint: 'https://www.google.com',
    respectDebugMode: true // Ensure it respects debug mode settings
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

  // Check for debug mode changes periodically instead of on every render
  // This avoids the infinite update loop
  useEffect(() => {
    const checkDebugMode = () => {
      const storedDebugMode = isDebugModeEnabled();
      if (storedDebugMode !== isDebugMode) {
        setIsDebugMode(storedDebugMode);
      }
    };

    // Check immediately on mount
    checkDebugMode();
    
    // Set up a timer to check periodically
    checkDebugModeTimerRef.current = window.setInterval(checkDebugMode, 5000);
    
    return () => {
      if (checkDebugModeTimerRef.current) {
        clearInterval(checkDebugModeTimerRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount and cleanup

  // Track loading duration with optimized performance
  useEffect(() => {
    const isLoading = associationLoading || activityLoading;

    if (isLoading) {
      if (loadingTimerRef.current === null) {
        const startTime = Date.now();
        setLoadingStartTime(startTime);
        
        // Use requestAnimationFrame for smoother updates in modern browsers
        const updateDuration = () => {
          // Only update duration every ~100ms to reduce render overhead
          const now = Date.now();
          const duration = now - startTime;
          if (Math.abs(duration - loadingDuration) > 100) {
            setLoadingDuration(duration);
          }
          
          // Continue animation frame loop if still loading
          if (isLoading) {
            loadingTimerRef.current = requestAnimationFrame(updateDuration);
          }
        };
        
        loadingTimerRef.current = requestAnimationFrame(updateDuration);
      }
    } else {
      if (loadingTimerRef.current !== null) {
        cancelAnimationFrame(loadingTimerRef.current);
        loadingTimerRef.current = null;
        
        // Calculate final duration when loading stops
        const finalDuration = loadingStartTime ? Date.now() - loadingStartTime : 0;
        setLoadingDuration(finalDuration);

        // Show toast with loading stats if debug mode is on
        if (isDebugMode && finalDuration > 0) {
          toast({
            title: "Dashboard loaded successfully",
            description: `Loaded in ${finalDuration}ms. Network: ${networkStatus.status}`,
            variant: "default",
          });
          
          // Log performance metrics in debug mode
          logDebug('Dashboard loading performance', {
            loadTime: finalDuration,
            networkStatus: networkStatus.status,
            retryCount
          }, 'info');
        }
        
        // Reset start time for the next loading cycle
        setLoadingStartTime(null);
        // Reset the slow loading warning flag
        hasShownSlowLoadingWarningRef.current = false;
      }
    }

    return () => {
      if (loadingTimerRef.current !== null) {
        cancelAnimationFrame(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [associationLoading, activityLoading, isDebugMode, networkStatus.status, toast, retryCount]);

  // Toggle debug mode with consistent localStorage update
  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newValue = !prev;
      enableDebugMode(newValue); // Update localStorage
      
      // Show toast for better user feedback
      toast({
        title: newValue ? "Debug mode enabled" : "Debug mode disabled",
        description: newValue 
          ? "Additional debugging information is now available." 
          : "Debug mode has been turned off.",
      });
      
      return newValue;
    });
  }, [toast]);

  const handleShowLocationManager = useCallback(() => {
    setShowLocationManager(true);
  }, []);

  const handleBackFromLocationManager = useCallback(() => {
    setShowLocationManager(false);
  }, []);

  // Show warning toast for slow loading only in debug mode
  // Using a separate effect to avoid race conditions with the loading timer
  useEffect(() => {
    const isLoading = associationLoading || activityLoading;
    
    // Only show warning if all these conditions are met:
    // 1. Currently loading
    // 2. Loading has been ongoing for more than 5 seconds
    // 3. Debug mode is enabled
    // 4. We haven't shown a warning yet for this loading cycle
    if (isLoading && loadingDuration > 5000 && isDebugMode && !hasShownSlowLoadingWarningRef.current) {
      toast({
        title: "Loading is taking longer than usual",
        description: `Current duration: ${Math.round(loadingDuration / 1000)}s. Network: ${networkStatus.status}`,
        variant: "warning",
      });
      
      // Mark that we've shown the warning for this loading cycle
      hasShownSlowLoadingWarningRef.current = true;
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
          retryCount={retryCount}
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
      loadTime={loadingDuration}
      requestInfo={requestInfo}
    />
  );
};

export default Dashboard;
