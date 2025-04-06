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
    testEndpoint = 'https://www.google.com',
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
    message?: string;
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
      // Use a different approach to test connectivity
      // Option 1: Use no-cors mode (will give an opaque response but works for connectivity testing)
      logDebug(`Testing connection with no-cors mode`, null, 'info');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use our app's API base URL + a known endpoint that should exist
      const apiBaseUrl = window.location.origin; // Use the current origin
      let testEndpointToUse = testEndpoint;
      
      try {
        // First attempt with the app's own base URL to check if we're online
        const localResponse = await fetch(`${apiBaseUrl}/`, { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        const isOnline = localResponse.status >= 200 && localResponse.status < 400;
        
        if (isOnline) {
          logDebug('Connection test successful using application base URL', null, 'info');
          setLastTestedAt(now);
          setTestResults({
            success: true,
            timestamp: now,
            message: 'Connected to application'
          });
          pendingTestRef.current = false;
          setIsTestingConnection(false);
          return true;
        }
      } catch (localError) {
        logDebug('Local endpoint test failed, trying external endpoint', localError, 'warn');
        // Continue to external endpoint test
      }
      
      // If local endpoint failed, try external with no-cors
      const response = await fetch(testEndpointToUse, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
        mode: 'no-cors' // Use no-cors mode to avoid CORS errors
      });
      
      clearTimeout(timeoutId);
      
      // With no-cors mode, we can't access response properties
      // But if we got here without an exception, the network is likely working
      logDebug('Connection test completed without errors', null, 'info');
      setLastTestedAt(now);
      setTestResults({
        success: true,
        timestamp: now,
        message: 'Connected successfully'
      });
      pendingTestRef.current = false;
      setIsTestingConnection(false);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('Cross-Origin');
      
      if (isCorsError) {
        logDebug('CORS error during connection test - this is expected with external domains', { error: errorMessage }, 'warn');
        // For CORS errors during testing, we can assume the network is working
        // The CORS error itself indicates we reached the server, just couldn't access the response
        setLastTestedAt(now);
        setTestResults({
          success: true, // Consider this a successful test since network is working
          timestamp: now,
          message: 'Connected (CORS limitation)'
        });
        pendingTestRef.current = false;
        setIsTestingConnection(false);
        return true;
      }
      
      // For other errors (like network failures)
      logDebug('Connection test failed', error, 'error');
      setLastTestedAt(now);
      setTestResults({
        success: false,
        timestamp: now,
        message: errorMessage
      });
      pendingTestRef.current = false;
      setIsTestingConnection(false);
      return false;
    }
  }, [lastTestedAt, testEndpoint]);
  
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
