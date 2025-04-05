
import React from 'react';
import { Package, FileBox, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Spinner, LoadingError } from '@/components/ui/spinner';
import { DashboardStats as DashboardStatsType } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  isLoading: boolean;
  error?: any;
  onRetry?: () => void;
  debugInfo?: {
    requestTimestamp?: number;
    responseTimestamp?: number;
    networkStatus?: 'online' | 'offline';
    requestAttempts?: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading, 
  error, 
  onRetry,
  debugInfo
}) => {
  if (error) {
    return (
      <div className="space-y-4">
        <LoadingError error={error} retry={onRetry} />
        
        {/* Debug information panel */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Debugging Information</AlertTitle>
          <AlertDescription className="text-xs font-mono">
            <details>
              <summary className="cursor-pointer">Show error details</summary>
              <div className="mt-2 p-2 bg-background border rounded-md overflow-auto max-h-[200px]">
                <pre className="whitespace-pre-wrap break-all">
                  {typeof error === 'object' 
                    ? JSON.stringify(error, null, 2) 
                    : String(error)}
                </pre>
              </div>
            </details>
            {debugInfo && (
              <div className="mt-2">
                <p>Network: {debugInfo.networkStatus || navigator.onLine ? 'Online' : 'Offline'}</p>
                {debugInfo.requestTimestamp && (
                  <p>Request time: {new Date(debugInfo.requestTimestamp).toISOString()}</p>
                )}
                {debugInfo.responseTimestamp && (
                  <p>Response time: {new Date(debugInfo.responseTimestamp).toISOString()}</p>
                )}
                {debugInfo.requestAttempts !== undefined && (
                  <p>Request attempts: {debugInfo.requestAttempts}</p>
                )}
                {debugInfo.requestTimestamp && debugInfo.responseTimestamp && (
                  <p>Request duration: {debugInfo.responseTimestamp - debugInfo.requestTimestamp}ms</p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-4">
          <Spinner size="lg" loadingText="Loading dashboard statistics..." color="primary" />
        </div>
        
        {/* Skeleton loading state */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="mt-1 h-3 w-32" />
            </div>
          ))}
        </div>
        
        {/* Network status indicator during loading */}
        {debugInfo && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <span className="font-semibold">Debug:</span> 
            Network {debugInfo.networkStatus || navigator.onLine ? 'Online' : 'Offline'} | 
            Attempt {debugInfo.requestAttempts || 1} | 
            Started {debugInfo.requestTimestamp ? new Date(debugInfo.requestTimestamp).toLocaleTimeString() : 'Unknown'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={stats.itemsCount}
          icon={<Package className="h-4 w-4" />}
          description="Items in inventory"
        />
        <StatCard
          title="Categories"
          value={stats.categoriesCount}
          icon={<FileBox className="h-4 w-4" />}
          description="Item categories"
        />
        <StatCard
          title="Locations"
          value={stats.locationsCount}
          icon={<MapPin className="h-4 w-4" />}
          description="Storage locations"
        />
        <StatCard
          title="Conventions"
          value={stats.conventionsCount}
          icon={<Calendar className="h-4 w-4" />}
          description="Total conventions"
        />
      </div>
      
      {/* Debug timestamp when data was successfully loaded */}
      {debugInfo && debugInfo.responseTimestamp && (
        <div className="text-xs text-muted-foreground text-right">
          Last loaded: {new Date(debugInfo.responseTimestamp).toLocaleTimeString()}
          {debugInfo.requestTimestamp && (
            <span> (took {debugInfo.responseTimestamp - debugInfo.requestTimestamp}ms)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
