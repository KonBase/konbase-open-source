
import React, { useState, useEffect, useCallback } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { logDebug } from '@/utils/debug';
import { useDashboardActivity } from '@/hooks/useDashboardActivity';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLocationView from '@/components/dashboard/DashboardLocationView';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DebugPanel from '@/utils/debug-panel';

const Dashboard = () => {
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const { user } = useAuth();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  
  const networkStatus = useNetworkStatus({
    showToasts: true,
    testInterval: 30000,
    testEndpoint: 'https://www.google.com'
  });
  
  const {
    isLoadingActivity,
    activityError,
    handleRetry,
    retryCount,
    lastError,
    safeRecentActivity
  } = useDashboardActivity(currentAssociation);
  
  useEffect(() => {
    logDebug('Dashboard component state', {
      associationLoading,
      user: user?.id,
      associationId: currentAssociation?.id,
      networkStatus: networkStatus.status,
      retryCount
    }, 'info');
  }, [associationLoading, user, currentAssociation, networkStatus.status, retryCount]);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  const handleShowLocationManager = useCallback(() => {
    setShowLocationManager(true);
  }, []);

  const handleBackFromLocationManager = useCallback(() => {
    setShowLocationManager(false);
  }, []);

  const error = activityError;
  
  // Loading state
  if (associationLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardSkeleton />
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
          />
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardError
        error={error}
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
    />
  );
};

export default Dashboard;
