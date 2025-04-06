
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader, Clock, Activity, Database } from 'lucide-react';

interface DashboardLoadingProps {
  networkStatus: 'online' | 'offline';
  loadingDuration?: number;
  isDebugMode?: boolean;
}

const DashboardLoading: React.FC<DashboardLoadingProps> = ({ 
  networkStatus, 
  loadingDuration = 0,
  isDebugMode = false
}) => {
  // Loading animations for cards
  const loadingIcons = [
    <Activity key="activity" className="h-8 w-8 text-primary animate-pulse" />,
    <Clock key="clock" className="h-8 w-8 text-primary animate-pulse" />,
    <Database key="database" className="h-8 w-8 text-primary animate-pulse" />
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        
        {isDebugMode && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <div className="flex justify-between">
              <span>Status: {networkStatus}</span>
              <span>Loading time: {loadingDuration}ms</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                {loadingIcons[i-1]}
                <Skeleton className="h-4 w-2/3" />
                <div className="w-full bg-secondary/30 rounded-full h-2.5 dark:bg-secondary/10">
                  <div 
                    className="bg-primary h-2.5 rounded-full animate-pulse" 
                    style={{ 
                      width: `${Math.min(100, loadingDuration / 100)}%`,
                      transition: 'width 0.5s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>

      <div className="flex justify-center my-8">
        <div className="flex items-center space-x-2">
          <Loader className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">
            {networkStatus === 'online' 
              ? 'Loading dashboard data...' 
              : 'Network connection issues, retrying...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardLoading;
