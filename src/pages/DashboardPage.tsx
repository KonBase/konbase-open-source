
import React, { Suspense, useState } from 'react';
import Dashboard from './Dashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logDebug } from '@/utils/debug';

const DashboardPage = () => {
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [key, setKey] = useState(0);

  const handleError = (error: Error) => {
    logDebug('Dashboard error caught by ErrorBoundary', error, 'error');
    setHasError(true);
    setErrorCount(prev => prev + 1);
  };

  const handleRetry = () => {
    logDebug('Manual dashboard reload requested', null, 'info');
    setHasError(false);
    setKey(prev => prev + 1);
  };

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
        key={key}
        onError={handleError}
        fallback={
          <div className="container mx-auto py-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading dashboard</AlertTitle>
              <AlertDescription>
                There was a problem loading your dashboard content.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleRetry}
              className="mb-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <DashboardSkeleton showErrorState />
          </div>
        }
      >
        <Suspense fallback={<div className="container mx-auto py-6"><DashboardSkeleton /></div>}>
          <Dashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default DashboardPage;
