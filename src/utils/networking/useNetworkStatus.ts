import { useState, useEffect } from 'react';

interface NetworkStatus {
  online: boolean;
  latency: number | null;
  status: 'online' | 'offline' | 'slow' | 'checking';
  lastChecked: Date | null;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    latency: null,
    status: navigator.onLine ? 'checking' : 'offline',
    lastChecked: null
  });

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, online: true, status: 'online' }));
      // Trigger a check when coming back online
      checkNetworkLatency();
    };
    
    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        online: false, 
        status: 'offline',
        latency: null
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    };
  }, []);

  // Network latency check function
  const checkNetworkLatency = async () => {
    if (!navigator.onLine) {
      setNetworkStatus(prev => ({ ...prev, status: 'offline', latency: null }));
      return;
    }

    setNetworkStatus(prev => ({ ...prev, status: 'checking' }));
    
    try {
      // Instead of external domains, use a known endpoint that supports CORS
      // Using our own API endpoint for checking - if deployed, this will have CORS enabled
      const startTime = Date.now();
      
      // Use the Supabase health check endpoint or a simple public endpoint on our own domain
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors' // This ensures we don't get CORS errors
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      setNetworkStatus({
        online: true,
        latency,
        status: latency > 500 ? 'slow' : 'online',
        lastChecked: new Date()
      });
    } catch (error) {
      // Even if the fetch fails, we may still be online, just unable to reach that specific endpoint
      setNetworkStatus({
        online: navigator.onLine,
        latency: null,
        status: navigator.onLine ? 'online' : 'offline',
        lastChecked: new Date()
      });
    }
  };

  // Check network on initial load and periodically
  useEffect(() => {
    checkNetworkLatency();
    
    // Check periodically, but only if the tab is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkNetworkLatency();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    networkStatus,
    checkNetworkLatency
  };
}

export default useNetworkStatus;
