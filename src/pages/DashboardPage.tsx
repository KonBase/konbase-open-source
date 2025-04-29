import { Suspense, useState, useEffect, useRef, memo } from 'react';
import Dashboard from './Dashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { useUserProfile } from '@/hooks/useUserProfile';

// Memoize the Dashboard component to prevent unnecessary re-renders
const MemoizedDashboard = memo(Dashboard);

const DashboardPage = () => {
  // Removed unused hasError state
  const [errorCount, setErrorCount] = useState(0);
  const [key, setKey] = useState(0);
  const reloadRequestedRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);
  const profile = useUserProfile(); // Destructure the returned value to avoid the unused variable error
  // Optionally, log or use the 'profile' variable if needed
  if (isDebugModeEnabled()) {
    logDebug('User profile loaded', profile, 'info');
  }

  const handleError = (error: Error) => {
    // Only log errors in debug mode
    if (isDebugModeEnabled()) {
      logDebug('Dashboard error caught by ErrorBoundary', error, 'error');
    }
    // Removed setHasError as hasError state is no longer used
    setErrorCount(prev => prev + 1);
  };

  const handleRetry = () => {
    // Only log in debug mode
    if (isDebugModeEnabled()) {
      logDebug('Manual dashboard reload requested', null, 'info');
    }
    // Removed setHasError as hasError state is no longer used
    setKey(prev => prev + 1); // Increment key to force remount
  };

  // Listen for dashboard reload requests from navigation events
  // Using a more optimized approach with debouncing
  useEffect(() => {
    const handleDashboardReloadRequest = () => {
      if (!reloadRequestedRef.current) {
        reloadRequestedRef.current = true;
        
        // Only log in debug mode
        if (isDebugModeEnabled()) {
          logDebug('Dashboard reload requested via event', null, 'info');
        }
        
        // Clear any existing timer
        if (reloadTimerRef.current !== null) {
          clearTimeout(reloadTimerRef.current);
        }
        
        // We use setTimeout to ensure we don't reload too frequently
        // This debounces reload requests
        reloadTimerRef.current = window.setTimeout(() => {
          setKey(prev => prev + 1);
          reloadRequestedRef.current = false;
          reloadTimerRef.current = null;
        }, 500); // Increased timeout to further reduce chances of rapid reloads
      }
    };

    window.addEventListener('dashboard-reload-requested', handleDashboardReloadRequest);
    
    return () => {
      window.removeEventListener('dashboard-reload-requested', handleDashboardReloadRequest);
      
      // Clean up any pending timers
      if (reloadTimerRef.current !== null) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {errorCount > 3 && (
        <div className="container mx-auto pt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Multiple loading errors detected</AlertTitle>
            <AlertDescription>
              There seems to be a persistent issue loading the dashboard. 
              This might be caused by network connectivity problems or a service disruption.
            </AlertDescription>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mr-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Reload Page
              </Button>
            </div>
          </Alert>
        </div>
      )}
      
      <ErrorBoundary 
        key={key} // Use key to force remount on retry
        onError={handleError} 
        fallback={
          <div className="container mx-auto py-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Dashboard Error</AlertTitle>
              <AlertDescription>
                An unexpected error occurred while loading the dashboard.
              </AlertDescription>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry} // Use the component's retry logic
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Try Again
                </Button>
              </div>
            </Alert>
          </div>
        }
        // Removed onReset as it is not supported by ErrorBoundary
        // Removed resetKeys as it is not supported by ErrorBoundary
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <MemoizedDashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default DashboardPage;
