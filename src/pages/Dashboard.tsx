
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useLocation } from 'react-router-dom';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { logDebug } from '@/utils/debug';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import LocationManagerView from '@/components/dashboard/LocationManagerView';
import DashboardRedirectHandler from '@/components/dashboard/DashboardRedirectHandler';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DebugPanel from '@/utils/debug-panel';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use our network status hook
  const { status: networkStatus, testConnection } = useNetworkStatus({
    onStatusChange: (status) => {
      // Network status change handling can go here if needed
      logDebug(`Network status changed to: ${status}`, null, 'info');
    }
  });
  
  // Check for debug mode on component mount and when it changes in localStorage
  useEffect(() => {
    const checkDebugMode = () => {
      const debugMode = localStorage.getItem('konbase-debug') === 'true';
      setIsDebugEnabled(debugMode);
    };
    
    // Initial check
    checkDebugMode();
    
    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'konbase-debug') {
        checkDebugMode();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Reset initial load state after association data is loaded
  useEffect(() => {
    if (!associationLoading) {
      // Use a short timeout to prevent flashing between loading states
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [associationLoading]);
  
  // Handle redirects from query parameters
  <DashboardRedirectHandler />
  
  // Show loading spinner only during initial load
  if (isInitialLoad && associationLoading) {
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

      {/* Add DashboardStats component */}
      <div className="grid grid-cols-12 gap-4">
        <DashboardStats />
      </div>

      {/* Conditionally render Debug Panel based on debug mode setting */}
      {isDebugEnabled && (
        <DebugPanel 
          networkStatus={networkStatus}
          userData={{
            userId: user?.id,
            associationId: currentAssociation?.id
          }}
          testConnection={async () => {
            await testConnection();
            return true;
          }}
        />
      )}

      {/* Association Management Module */}
      <AssociationManagementSection onShowLocationManager={() => setShowLocationManager(true)} />

      {/* Convention Management Module */}
      <ConventionManagementSection />

      {/* Communication Module */}
      <CommunicationSection unreadNotifications={0} />
    </div>
  );
};

export default Dashboard;
