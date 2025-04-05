
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useLocation } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { logDebug } from '@/utils/debug';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import LocationManagerView from '@/components/dashboard/LocationManagerView';
import DashboardRedirectHandler from '@/components/dashboard/DashboardRedirectHandler';
import DebugPanel from '@/utils/debug-panel';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  const [showLocationManager, setShowLocationManager] = useState(false);
  
  // Use our new network status hook
  const { status: networkStatus, testConnection } = useNetworkStatus({
    onStatusChange: (status) => {
      // Retry data loading when connection is restored
      if (status === 'online' && error) {
        logDebug('Auto-retrying after connection restored', null, 'info');
        handleRetry();
      }
    }
  });
  
  const {
    stats,
    isLoading,
    error,
    handleRetry,
    unreadNotifications,
    requestTimestamp,
    responseTimestamp,
    retryCount,
    errorDetails
  } = useDashboardStats(currentAssociation, user);
  
  // Handle redirects from query parameters
  <DashboardRedirectHandler />
  
  if (associationLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="xl" loadingText="Loading your dashboard..." />
      </div>
    );
  }

  if (!currentAssociation) {
    return <NoAssociationView />;
  }

  if (showLocationManager && currentAssociation) {
    return (
      <LocationManagerView 
        onBack={() => setShowLocationManager(false)} 
        currentAssociation={currentAssociation} 
      />
    );
  }

  const isHome = location.pathname === "/dashboard";
  
  // Show network status alert if offline
  const showNetworkAlert = networkStatus === 'offline';

  return (
    <div className="space-y-6">
      {showNetworkAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Network Disconnected</AlertTitle>
          <AlertDescription>
            You are currently offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}
      
      <DashboardHeader 
        currentAssociation={currentAssociation} 
        user={user} 
        isHome={isHome} 
      />

      {/* Debug Panel */}
      <DebugPanel 
        networkStatus={networkStatus}
        requestInfo={{
          requestTimestamp,
          responseTimestamp,
          retryCount
        }}
        userData={{
          userId: user?.id,
          associationId: currentAssociation?.id
        }}
        errorData={errorDetails}
        onRetry={handleRetry}
        testConnection={testConnection}
      />

      {/* Stats Cards */}
      <DashboardStats 
        stats={stats} 
        isLoading={isLoading} 
        error={error} 
        onRetry={handleRetry}
        debugInfo={{
          requestTimestamp,
          responseTimestamp,
          networkStatus,
          requestAttempts: retryCount + 1
        }}
      />

      {/* Association Management Module */}
      <AssociationManagementSection onShowLocationManager={() => setShowLocationManager(true)} />

      {/* Convention Management Module */}
      <ConventionManagementSection />

      {/* Communication Module */}
      <CommunicationSection unreadNotifications={unreadNotifications} />
    </div>
  );
};

export default Dashboard;
