import { useState, useEffect, useCallback, useRef } from 'react';
import { logDebug } from '@/utils/debug';
import { toast } from '@/components/ui/use-toast';

interface NetworkStatusOptions {
  showToasts?: boolean;
  onStatusChange?: (status: 'online' | 'offline') => void;
  testEndpoint?: string;
  testInterval?: number;
}

export const useNetworkStatus = (options: NetworkStatusOptions = {}) => {
  const { 
    showToasts = true, 
    onStatusChange,
    testEndpoint = 'https://ceeoxorrfduotwfgmegx.supabase.co/rest/v1/',
    testInterval = 30000 // Default to 30 seconds to avoid excessive requests
  } = options;
  
  const [status, setStatus] = useState<'online' | 'offline'>(
    navigator.onLine ? 'online' : 'offline'
  );
  
  const [lastTestedAt, setLastTestedAt] = useState<number | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    timestamp: number;
    error?: Error;
  } | null>(null);
  
  const pendingTestRef = useRef<boolean>(false);
  const throttleTimeoutRef = useRef<number | null>(null);
  
  const handleOnline = useCallback(() => {
    setStatus('online');
    
    if (showToasts) {
      toast({
        title: "Connection restored",
        description: "Network connection has been re-established",
        variant: "default"
      });
    }
    
    logDebug('Network connection restored', null, 'info');
    
    if (onStatusChange) {
      onStatusChange('online');
    }
  }, [showToasts, onStatusChange]);
  
  const handleOffline = useCallback(() => {
    setStatus('offline');
    
    if (showToasts) {
      toast({
        title: "Connection lost",
        description: "Network connection has been lost",
        variant: "destructive"
      });
    }
    
    logDebug('Network connection lost', null, 'warn');
    
    if (onStatusChange) {
      onStatusChange('offline');
    }
  }, [showToasts, onStatusChange]);
  
  // Test network connectivity to a specific endpoint with throttling
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (pendingTestRef.current) return false; // Already testing
    
    // Throttle test requests to prevent resource exhaustion
    const now = Date.now();
    if (lastTestedAt && now - lastTestedAt < 5000) {
      logDebug('Connection test throttled - too frequent requests', null, 'warn');
      return false; // Return false to indicate throttled request
    }
    
    pendingTestRef.current = true;
    setIsTestingConnection(true);
    
    try {
      logDebug(`Testing connection to ${testEndpoint}`, null, 'info');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(testEndpoint, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      const isConnected = response.ok;
      const timestamp = Date.now();
      setLastTestedAt(timestamp);
      
      const result = { success: isConnected, timestamp };
      setTestResults(result);
      
      logDebug(`Connection test result: ${isConnected ? 'Connected' : 'Failed'}`, null, 'info');
      return isConnected;
    } catch (error) {
      const timestamp = Date.now();
      setLastTestedAt(timestamp);
      
      const result = { 
        success: false, 
        timestamp,
        error: error instanceof Error ? error : new Error(String(error))
      };
      setTestResults(result);
      
      logDebug('Connection test error', error, 'error');
      return false;
    } finally {
      pendingTestRef.current = false;
      setIsTestingConnection(false);
    }
  }, [testEndpoint, lastTestedAt]);
  
  const throttledTestConnection = useCallback(async (): Promise<boolean> => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    return new Promise<boolean>((resolve) => {
      throttleTimeoutRef.current = window.setTimeout(async () => {
        const result = await testConnection();
        throttleTimeoutRef.current = null;
        resolve(result);
      }, 1000) as unknown as number;
    });
  }, [testConnection]);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Log initial network status
    logDebug(`Initial network status: ${status}`, null, 'info');
    
    // Initial connection test with delay to avoid immediate testing
    const initialTestTimeout = setTimeout(() => {
      testConnection();
    }, 2000);
    
    // Set up periodic testing if specified
    let intervalId: number | undefined;
    if (testInterval > 0) {
      intervalId = window.setInterval(() => {
        if (!pendingTestRef.current && navigator.onLine) {
          testConnection();
        }
      }, testInterval) as unknown as number;
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialTestTimeout);
      if (intervalId) clearInterval(intervalId);
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
    };
  }, [handleOnline, handleOffline, testConnection, testInterval, status]);
  
  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    testConnection: throttledTestConnection,
    isTestingConnection,
    lastTestedAt,
    testResults
  };
};

export default useNetworkStatus;
