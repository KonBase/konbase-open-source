import React, { useState, useCallback, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { LoadingError } from '@/components/ui/spinner';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { logDebug } from '@/utils/debug';
import DebugPanel from '@/utils/debug-panel';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';
import MemberManager from '@/components/association/MemberManager';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import DashboardOverviewSection from '@/components/dashboard/DashboardOverviewSection';
import DebugModeToggle from '@/components/dashboard/DebugModeToggle';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

const Dashboard = () => {
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  const networkStatus = useNetworkStatus({
    showToasts: true,
    testInterval: 30000,
    testEndpoint: 'https://www.google.com'
  });
  
  useEffect(() => {
    logDebug('Dashboard component state', {
      associationLoading,
      user: user?.id,
      associationId: currentAssociation?.id,
      networkStatus: networkStatus.status,
      retryCount
    }, 'info');
  }, [associationLoading, user, currentAssociation, networkStatus.status, retryCount]);
  
  const { 
    data: recentActivity, 
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity
  } = useSupabaseQuery<AuditLog[]>(
    ['recent-activity', currentAssociation?.id, retryCount],
    async () => {
      if (!currentAssociation?.id) return { data: [] as AuditLog[], error: null };
      
      logDebug(`Fetching recent activity for association ${currentAssociation.id}`, null, 'info');
      
      return await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'associations')
        .eq('entity_id', currentAssociation.id)
        .order('created_at', { ascending: false })
        .limit(5);
    },
    {
      enabled: !!currentAssociation?.id,
      staleTime: 30000, // Removed type casting
      onError: (error) => {
        logDebug('Error fetching recent activity', error, 'error');
        setLastError(error);
      }
    }
  );

  const handleRetry = useCallback(() => {
    logDebug('Manually retrying data fetch', null, 'info');
    setRetryCount(count => count + 1);
    refetchActivity();
  }, [refetchActivity]);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  const error = activityError;
  
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

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            There was a problem loading your dashboard data. Please try again.
          </AlertDescription>
        </Alert>
        
        <LoadingError 
          error={error} 
          retry={handleRetry} 
        />
        
        <DebugModeToggle 
          isDebugMode={isDebugMode} 
          toggleDebugMode={toggleDebugMode} 
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
            errorData={error}
            onRetry={handleRetry}
          />
        )}
      </div>
    );
  }

  const isHome = true;

  const showLocationManager = () => {
    console.log('Location manager should open');
  };

  // Ensure recentActivity is always an array
  const safeRecentActivity = Array.isArray(recentActivity?.data) ? recentActivity.data : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-8">
        <DashboardHeader 
          currentAssociation={currentAssociation} 
          user={user} 
          isHome={isHome} 
        />

        <ErrorBoundary>
          <DashboardOverviewSection 
            currentAssociation={currentAssociation}
            isLoadingActivity={isLoadingActivity}
            recentActivity={safeRecentActivity}
            activityError={activityError}
            handleRetry={handleRetry}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <AssociationManagementSection onShowLocationManager={showLocationManager} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ConventionManagementSection />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <CommunicationSection unreadNotifications={0} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <div className="py-6">
            <MemberManager minimal />
          </div>
        </ErrorBoundary>
        
        <div className="mt-8">
          <DebugModeToggle 
            isDebugMode={isDebugMode} 
            toggleDebugMode={toggleDebugMode} 
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
              errorData={lastError}
              onRetry={handleRetry}
              requestInfo={{
                retryCount,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
