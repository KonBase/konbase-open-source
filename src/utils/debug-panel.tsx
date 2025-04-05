
import React, { useState } from 'react';
import { enableDebugMode, logDebug } from '@/utils/debug';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Wifi, WifiOff, RefreshCw, X, ChevronDown, ChevronRight } from 'lucide-react';

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
  testConnection?: () => Promise<boolean>;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  networkStatus,
  requestInfo,
  userData,
  errorData,
  onRetry,
  testConnection
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<boolean | null>(null);
  
  const handleTestConnection = async () => {
    if (!testConnection) return;
    
    setIsTestingConnection(true);
    try {
      const result = await testConnection();
      setConnectionTestResult(result);
      logDebug('Connection test result', { success: result }, 'info');
    } catch (error) {
      logDebug('Connection test error', error, 'error');
      setConnectionTestResult(false);
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleEnableDebugMode = () => {
    enableDebugMode(true);
    logDebug('Debug mode enabled via debug panel', null, 'info');
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
              <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
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
          
          {connectionTestResult !== null && (
            <div className={`text-xs p-1 rounded ${connectionTestResult ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              Connection test: {connectionTestResult ? 'Successful' : 'Failed'}
            </div>
          )}
          
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
        </AlertDescription>
      )}
    </Alert>
  );
};

export default DebugPanel;
