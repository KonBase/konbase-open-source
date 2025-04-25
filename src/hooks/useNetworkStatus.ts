import { useState, useEffect, useCallback, useRef } from 'react';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { toast } from '@/components/ui/use-toast';

interface NetworkStatusOptions {
  showToasts?: boolean;
  onStatusChange?: (status: 'online' | 'offline') => void;
  testEndpoint?: string;
  testInterval?: number;
  respectDebugMode?: boolean; // New option to respect debug mode
}

export const useNetworkStatus = (options: NetworkStatusOptions = {}) => {
  const { 
    showToasts = true, 
    onStatusChange,
    testEndpoint = 'https://www.google.com',
    testInterval = 30000, // Default to 30 seconds to avoid excessive requests
    respectDebugMode = true // By default, respect debug mode
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
  const lastDebugModeRef = useRef<boolean>(isDebugModeEnabled());
  const activeIntervalIdRef = useRef<number | null>(null);
  
  // Check if we should perform network operations based on debug mode
  const shouldPerformNetworkOperations = useCallback(() => {
    // If respectDebugMode is false, always perform operations regardless of debug mode
    if (!respectDebugMode) return true;
    
    // Otherwise only perform operations if debug mode is enabled
    const isDebugMode = isDebugModeEnabled();
    
    // If debug mode changed from enabled to disabled, we should log that
    if (lastDebugModeRef.current && !isDebugMode) {
      console.info('[Konbase] Network monitoring reduced due to debug mode being disabled');
    }
    
    // Update the ref to track changes
    lastDebugModeRef.current = isDebugMode;
    
    return isDebugMode;
  }, [respectDebugMode]);
  
  const handleOnline = useCallback(() => {
    setStatus('online');
    
    if (showToasts && shouldPerformNetworkOperations()) {
      toast({
        title: "Connection restored",
        description: "Network connection has been re-established",
        variant: "default"
      });
    }
    
    if (shouldPerformNetworkOperations()) {
      logDebug('Network connection restored', null, 'info');
    }
    
    if (onStatusChange) {
      onStatusChange('online');
    }
  }, [showToasts, onStatusChange, shouldPerformNetworkOperations]);
  
  const handleOffline = useCallback(() => {
    setStatus('offline');
    
    if (showToasts && shouldPerformNetworkOperations()) {
      toast({
        title: "Connection lost",
        description: "Network connection has been lost",
        variant: "destructive"
      });
    }
    
    if (shouldPerformNetworkOperations()) {
      logDebug('Network connection lost', null, 'warn');
    }
    
    if (onStatusChange) {
      onStatusChange('offline');
    }
  }, [showToasts, onStatusChange, shouldPerformNetworkOperations]);
  
  // Test network connectivity to a specific endpoint with throttling
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (pendingTestRef.current) return false; // Already testing
    
    // Don't perform the test if debug mode is disabled and we're respecting debug mode
    if (respectDebugMode && !isDebugModeEnabled()) {
      return navigator.onLine; // Just return current browser online status
    }
    
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
  }, [lastTestedAt, testEndpoint, respectDebugMode]);
  
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

  // Configure dynamic interval based on debug mode
  const updateConnectionTestInterval = useCallback(() => {
    // Clear any existing interval
    if (activeIntervalIdRef.current) {
      clearInterval(activeIntervalIdRef.current);
      activeIntervalIdRef.current = null;
    }

    // Don't set up intervals if testInterval is 0 or negative
    if (testInterval <= 0) return;
    
    // Determine the actual interval to use based on debug mode
    const effectiveInterval = shouldPerformNetworkOperations() 
      ? testInterval  // Use configured interval when debug mode is on
      : Math.max(60000, testInterval * 3);  // Use longer interval when debug mode is off
    
    // Set up the new interval
    activeIntervalIdRef.current = window.setInterval(() => {
      // Only perform the test if:
      // 1. We're not already testing
      // 2. Browser reports online status
      // 3. Debug mode is enabled or we're not respecting debug mode
      if (!pendingTestRef.current && navigator.onLine && 
          (shouldPerformNetworkOperations() || !respectDebugMode)) {
        testConnection();
      }
    }, effectiveInterval) as unknown as number;
  }, [testInterval, testConnection, shouldPerformNetworkOperations, respectDebugMode]);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Only log initial network status if debug mode is enabled
    if (shouldPerformNetworkOperations()) {
      logDebug(`Initial network status: ${status}`, null, 'info');
    }
    
    // Initial connection test with delay to avoid immediate testing
    // but only if debug mode is enabled or we're not respecting debug mode
    let initialTestTimeout: number | undefined;
    if (shouldPerformNetworkOperations() || !respectDebugMode) {
      initialTestTimeout = window.setTimeout(() => {
        testConnection();
      }, 2000) as unknown as number;
    }
    
    // Set up interval with the appropriate timing
    updateConnectionTestInterval();
    
    // Watch for changes in debug mode
    const checkDebugModeInterval = window.setInterval(() => {
      const currentDebugMode = isDebugModeEnabled();
      if (currentDebugMode !== lastDebugModeRef.current) {
        // Debug mode changed, update our interval
        lastDebugModeRef.current = currentDebugMode;
        updateConnectionTestInterval();
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (initialTestTimeout) clearTimeout(initialTestTimeout);
      if (activeIntervalIdRef.current) clearInterval(activeIntervalIdRef.current);
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      clearInterval(checkDebugModeInterval);
    };
  }, [
    handleOnline, 
    handleOffline, 
    testConnection, 
    updateConnectionTestInterval, 
    status, 
    shouldPerformNetworkOperations,
    respectDebugMode
  ]);
  
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
