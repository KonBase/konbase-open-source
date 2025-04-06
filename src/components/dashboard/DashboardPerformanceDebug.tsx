import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, Database, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMetrics from '@/utils/debug/performance-metrics';
import { logDebug } from '@/utils/debug';
import { supabase } from '@/integrations/supabase/client';

interface DashboardPerformanceDebugProps {
  isVisible: boolean;
  networkStatus: {
    status: 'online' | 'offline';
    testConnection: () => Promise<boolean | null>;
    isTestingConnection: boolean;
    lastTestedAt: number | null;
    testResults: {
      success: boolean;
      timestamp: number;
      error?: Error;
    } | null;
  };
  loadTime: number;
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
    retryCount?: number;
  };
}

const DashboardPerformanceDebug: React.FC<DashboardPerformanceDebugProps> = ({
  isVisible,
  networkStatus,
  loadTime,
  requestInfo
}) => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);
  const [hasWarnings, setHasWarnings] = useState(false);
  
  // Calculate query time if available
  const queryTime = requestInfo?.requestTimestamp && requestInfo?.responseTimestamp
    ? requestInfo.responseTimestamp - requestInfo.requestTimestamp
    : null;
  
  const testNetworkLatency = async () => {
    setIsTesting(true);
    
    try {
      const start = performance.now();
      await fetch('https://www.google.com', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors' 
      });
      const end = performance.now();
      const latency = Math.round(end - start);
      setNetworkLatency(latency);
      logDebug('Network latency test', { latency: `${latency}ms` }, 'info');
      
      if (latency > 500) {
        setHasWarnings(true);
      }
      
      return latency;
    } catch (error) {
      logDebug('Network latency test failed', error, 'error');
      setHasWarnings(true);
      return null;
    } finally {
      setIsTesting(false);
    }
  };
  
  const testSupabaseLatency = async () => {
    setIsTesting(true);
    
    try {
      const start = performance.now();
      await fetch('https://ecvsnnfdaqjnbcpvxlly.supabase.co', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors' 
      });
      const end = performance.now();
      const latency = Math.round(end - start);
      setSupabaseLatency(latency);
      logDebug('Supabase latency test', { latency: `${latency}ms` }, 'info');
      
      if (latency > 800) {
        setHasWarnings(true);
      }
      
      return latency;
    } catch (error) {
      logDebug('Supabase latency test failed', error, 'error');
      setHasWarnings(true);
      return null;
    } finally {
      setIsTesting(false);
    }
  };
  
  useEffect(() => {
    if (isVisible) {
      testNetworkLatency();
      testSupabaseLatency();
    }
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Performance Debug Tools</span>
          {hasWarnings && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-2">
            <TabsTrigger value="metrics" className="text-xs">Performance Metrics</TabsTrigger>
            <TabsTrigger value="network" className="text-xs">Network Tests</TabsTrigger>
            <TabsTrigger value="api" className="text-xs">API Diagnostics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-2">
            <PerformanceMetrics 
              networkLatency={networkLatency}
              loadTime={loadTime}
              queryTime={queryTime}
              isVisible={activeTab === 'metrics'}
            />
          </TabsContent>
          
          <TabsContent value="network" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background p-2 rounded border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center">
                    <Wifi className="h-3 w-3 mr-1" /> External Network
                  </span>
                  <span className={networkLatency && networkLatency > 500 ? 'text-red-500' : ''}>
                    {networkLatency ? `${networkLatency}ms` : 'Unknown'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full h-7 text-xs"
                  onClick={testNetworkLatency}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Test Latency
                </Button>
              </div>
              
              <div className="bg-background p-2 rounded border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center">
                    <Database className="h-3 w-3 mr-1" /> Supabase API
                  </span>
                  <span className={supabaseLatency && supabaseLatency > 800 ? 'text-red-500' : ''}>
                    {supabaseLatency ? `${supabaseLatency}ms` : 'Unknown'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full h-7 text-xs"
                  onClick={testSupabaseLatency}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Test API
                </Button>
              </div>
            </div>
            
            <div className="text-xs bg-background p-2 rounded border">
              <div className="font-medium mb-1">Connection Status</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Network Status:</span>
                  <span className={networkStatus.status === 'offline' ? 'text-red-500' : 'text-green-500'}>
                    {networkStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Tested:</span>
                  <span>
                    {networkStatus.lastTestedAt 
                      ? new Date(networkStatus.lastTestedAt).toLocaleTimeString() 
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Test Result:</span>
                  <span className={networkStatus.testResults?.success ? 'text-green-500' : 'text-red-500'}>
                    {networkStatus.testResults?.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2 h-7 text-xs"
                onClick={networkStatus.testConnection}
                disabled={networkStatus.isTestingConnection}
              >
                {networkStatus.isTestingConnection ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Test Connection
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-2">
            <div className="text-xs bg-background p-2 rounded border overflow-auto max-h-[200px]">
              <div className="font-medium mb-1">API Request Info</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify({
                  requestStarted: requestInfo?.requestTimestamp 
                    ? new Date(requestInfo.requestTimestamp).toISOString() 
                    : null,
                  requestCompleted: requestInfo?.responseTimestamp 
                    ? new Date(requestInfo.responseTimestamp).toISOString() 
                    : null,
                  duration: queryTime ? `${queryTime}ms` : null,
                  retries: requestInfo?.retryCount || 0,
                }, null, 2)}
              </pre>
            </div>
            
            <div className="text-xs bg-muted p-2 rounded">
              <p className="mb-1 font-medium">Troubleshooting Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>High Supabase latency ({`>`}800ms) may indicate database connection issues</li>
                <li>API failures with long load times could mean rate limiting</li>
                <li>Multiple retries suggest intermittent connectivity</li>
                <li>Check browser console for detailed error logs</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardPerformanceDebug;
