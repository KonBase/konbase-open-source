
import React, { useState, useEffect } from 'react';
import { enableDebugMode, logDebug } from '@/utils/debug';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Wifi, WifiOff, RefreshCw, X, ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react';

interface DebugPanelProps {
  networkStatus: 'online' | 'offline';
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
    retryCount?: number;
  };
  userData?: {
    userId?: string;
    associationId?: string;
  };
  errorData?: any;
  onRetry?: () => void;
  testConnection?: () => Promise<boolean | null>;
  isTestingConnection?: boolean;
  lastTestedAt?: number | null;
  testResults?: {
    success: boolean;
    timestamp: number;
    error?: Error;
  } | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  networkStatus,
  requestInfo,
  userData,
  errorData,
  onRetry,
  testConnection,
  isTestingConnection,
  lastTestedAt,
  testResults
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<boolean | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  
  // Track error count to show a warning if errors are increasing
  useEffect(() => {
    if (errorData) {
      setErrorCount(prev => prev + 1);
    }
  }, [errorData]);

  // Reset error count when network status changes to online
  useEffect(() => {
    if (networkStatus === 'online') {
      setErrorCount(0);
    }
  }, [networkStatus]);
  
  const handleTestConnection = async () => {
    if (!testConnection || isTestingConnection) return;
    
    try {
      const result = await testConnection();
      setConnectionTestResult(result === null ? null : !!result);
      logDebug('Manual connection test result', { success: result }, 'info');
    } catch (error) {
      logDebug('Manual connection test error', error, 'error');
      setConnectionTestResult(false);
    }
  };
  
  const handleEnableDebugMode = () => {
    enableDebugMode(true);
    logDebug('Debug mode enabled via debug panel', null, 'info');
  };

  // Format time elapsed since last test
  const formatTimeElapsed = () => {
    if (!lastTestedAt) return 'Never';
    const elapsed = Date.now() - lastTestedAt;
    if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`;
    return `${Math.floor(elapsed / 60000)}m ago`;
  };
  
  return (
    <Alert variant="debug" className="mt-4 text-xs">
      <Bug className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Debug Panel</span>
          <Badge variant={networkStatus === 'online' ? 'outline' : 'destructive'} className="text-xs">
            {networkStatus === 'online' ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : (
              <WifiOff className="h-3 w-3 mr-1" />
            )}
            {networkStatus}
          </Badge>
          {errorCount > 3 && (
            <Badge variant="warning" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Multiple Errors
            </Badge>
          )}
          {isTestingConnection && (
            <Badge variant="info" className="text-xs animate-pulse">
              Testing...
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </AlertTitle>
      
      {isExpanded && (
        <AlertDescription className="space-y-2 mt-2">
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRetry} 
                className="h-7 text-xs"
                disabled={isTestingConnection}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isTestingConnection ? 'animate-spin' : ''}`} /> 
                Retry
              </Button>
            )}
            {testConnection && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleTestConnection} 
                disabled={isTestingConnection}
                className="h-7 text-xs"
              >
                <Wifi className="h-3 w-3 mr-1" /> 
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleEnableDebugMode} className="h-7 text-xs">
              <Bug className="h-3 w-3 mr-1" /> Enable Debug Mode
            </Button>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold flex justify-between items-center">
              <span>Connection Status</span>
              <span className="text-muted-foreground">Last checked: {formatTimeElapsed()}</span>
            </div>
            
            {testResults && (
              <div className={`text-xs p-1 rounded ${testResults.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <div className="flex justify-between">
                  <span>Connection test: {testResults.success ? 'Successful' : 'Failed'}</span>
                  <span>{new Date(testResults.timestamp).toLocaleTimeString()}</span>
                </div>
                {testResults.error && (
                  <div className="mt-1 text-xs overflow-hidden text-ellipsis">
                    Error: {testResults.error.message}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="font-mono text-xs bg-background p-2 rounded border overflow-auto max-h-[200px]">
            <p>Network: {networkStatus}</p>
            {userData?.userId && <p>User ID: {userData.userId}</p>}
            {userData?.associationId && <p>Association ID: {userData.associationId}</p>}
            {requestInfo?.retryCount !== undefined && <p>Retry Count: {requestInfo.retryCount}</p>}
            {requestInfo?.requestTimestamp && (
              <p>Request Time: {new Date(requestInfo.requestTimestamp).toLocaleTimeString()}</p>
            )}
            {requestInfo?.responseTimestamp && (
              <p>Response Time: {new Date(requestInfo.responseTimestamp).toLocaleTimeString()}</p>
            )}
            {requestInfo?.requestTimestamp && requestInfo?.responseTimestamp && (
              <p>Duration: {requestInfo.responseTimestamp - requestInfo.requestTimestamp}ms</p>
            )}
          </div>
          
          {errorData && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold">Error Details</summary>
              <pre className="mt-2 p-2 bg-background border rounded-md overflow-auto max-h-[200px] text-xs text-red-500">
                {typeof errorData === 'object' 
                  ? JSON.stringify(errorData, null, 2) 
                  : String(errorData)}
              </pre>
            </details>
          )}
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Rate Limit: 10 req/sec</span>
            <span>
              <Info className="h-3 w-3 inline mr-1" />
              ERR_INSUFFICIENT_RESOURCES indicates rate limiting
            </span>
          </div>
        </AlertDescription>
      )}
    </Alert>
  );
};

export default DebugPanel;
