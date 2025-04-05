
import { useState, useEffect, useCallback } from 'react';
import { logDebug } from '@/utils/debug';
import { toast } from '@/components/ui/use-toast';

interface NetworkStatusOptions {
  showToasts?: boolean;
  onStatusChange?: (status: 'online' | 'offline') => void;
}

export const useNetworkStatus = (options: NetworkStatusOptions = {}) => {
  const { showToasts = true, onStatusChange } = options;
  
  const [status, setStatus] = useState<'online' | 'offline'>(
    navigator.onLine ? 'online' : 'offline'
  );
  
  const handleOnline = useCallback(() => {
    setStatus('online');
    
    if (showToasts) {
      toast({
        title: "Connection restored",
        description: "Network connection has been re-established",
        variant: "success"
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
  
  // Test network connectivity to a specific endpoint
  const testConnection = useCallback(async (url = 'https://ceeoxorrfduotwfgmegx.supabase.co/rest/v1/') => {
    if (!navigator.onLine) return false;
    
    try {
      logDebug(`Testing connection to ${url}`, null, 'debug');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      const isConnected = response.ok;
      logDebug(`Connection test result: ${isConnected ? 'Connected' : 'Failed'}`, null, 'debug');
      return isConnected;
    } catch (error) {
      logDebug('Connection test error', error, 'error');
      return false;
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Log initial network status
    logDebug(`Initial network status: ${status}`, null, 'info');
    
    // Initial connection test
    testConnection();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, handleOnline, handleOffline, testConnection]);
  
  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    testConnection
  };
};

export default useNetworkStatus;
