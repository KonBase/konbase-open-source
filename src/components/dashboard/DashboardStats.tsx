
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import DebugPanel from '@/utils/debug-panel';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssociation } from '@/contexts/AssociationContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { LayoutGrid, Package, Folder, Calendar } from 'lucide-react';

export function DashboardStats() {
  const { status: networkStatus, testConnection, isTestingConnection, lastTestedAt, testResults } = useNetworkStatus({
    testInterval: 60000, // Check connection every minute
    showToasts: true
  });
  const { currentAssociation } = useAssociation();
  const [retryCount, setRetryCount] = useState(0);
  const [requestTimestamp, setRequestTimestamp] = useState<number | null>(null);
  const [responseTimestamp, setResponseTimestamp] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const { isLoading, error, refetch, dashboardData, isInitialLoad } = useDashboardStats({
    onRequestStart: () => {
      setRequestTimestamp(Date.now());
      setResponseTimestamp(null);
    },
    onRequestEnd: () => {
      setResponseTimestamp(Date.now());
    }
  });

  // Add fade-in animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle retry with exponential backoff
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // Wait longer between retries to avoid overwhelming the server
    const backoffTime = Math.min(Math.pow(2, retryCount) * 1000, 30000);
    
    setTimeout(() => {
      refetch();
      // Wrap testConnection in a function that returns a Promise<boolean>
      const runTest = async () => {
        await testConnection();
        return true;
      };
      runTest();
    }, backoffTime);
  };

  if (error) {
    return (
      <Card className={`col-span-12 lg:col-span-8 md:col-span-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Dashboard Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Error loading dashboard statistics</p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              disabled={isTestingConnection}
              className="mx-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <DebugPanel 
            networkStatus={networkStatus}
            errorData={error}
            onRetry={handleRetry}
            testConnection={async () => {
              await testConnection();
              return true;
            }}
            isTestingConnection={isTestingConnection}
            lastTestedAt={lastTestedAt}
            testResults={testResults}
            requestInfo={{
              requestTimestamp,
              responseTimestamp,
              retryCount
            }}
            userData={{
              associationId: currentAssociation?.id
            }}
          />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`col-span-12 lg:col-span-8 md:col-span-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Dashboard Statistics</CardTitle>
        {!isInitialLoad && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              refetch();
              const runTest = async () => {
                await testConnection();
                return true;
              };
              runTest();
            }}
            disabled={isTestingConnection || isLoading}
            className="transition-opacity duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${(isTestingConnection || isLoading) ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      
      {/* Show loading progress bar during initial load */}
      {isInitialLoad && (
        <div className="px-6 pb-2">
          <Progress value={45} className="h-1" />
        </div>
      )}
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Items"
            value={isLoading ? "-" : (dashboardData?.itemCount || 0).toString()}
            icon={<Package className="h-4 w-4" />}
            className="min-h-[90px]"
          />
          <StatCard
            title="Categories"
            value={isLoading ? "-" : (dashboardData?.categoryCount || 0).toString()}
            icon={<Folder className="h-4 w-4" />}
            className="min-h-[90px]"
          />
          <StatCard
            title="Locations"
            value={isLoading ? "-" : (dashboardData?.locationCount || 0).toString()}
            icon={<LayoutGrid className="h-4 w-4" />}
            className="min-h-[90px]"
          />
          <StatCard
            title="Conventions"
            value={isLoading ? "-" : (dashboardData?.conventionCount || 0).toString()}
            icon={<Calendar className="h-4 w-4" />}
            className="min-h-[90px]"
          />
        </div>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              {dashboardData?.recentNotifications && dashboardData.recentNotifications.length > 0 ? (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-medium mb-2">Recent Notifications</h3>
                  <ul className="space-y-2">
                    {dashboardData.recentNotifications.map((notification, index) => (
                      <li key={index} className="text-sm p-2 bg-muted/50 rounded">
                        <span className="font-medium">{notification.title}</span>: {notification.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No recent notifications</p>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <DebugPanel 
          networkStatus={networkStatus}
          errorData={error}
          onRetry={handleRetry}
          testConnection={async () => {
            await testConnection();
            return true;
          }}
          isTestingConnection={isTestingConnection}
          lastTestedAt={lastTestedAt}
          testResults={testResults}
          requestInfo={{
            requestTimestamp,
            responseTimestamp,
            retryCount
          }}
          userData={{
            associationId: currentAssociation?.id
          }}
        />
      </CardFooter>
    </Card>
  );
}

// Make sure we export both as named and default export for backward compatibility
export default DashboardStats;
