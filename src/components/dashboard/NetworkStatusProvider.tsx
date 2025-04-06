
import React, { ReactNode } from 'react';
import useNetworkStatus from '@/hooks/useNetworkStatus';

interface NetworkStatusProviderProps {
  children: ReactNode;
  networkStatus: ReturnType<typeof useNetworkStatus>;
}

const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ 
  children, 
  networkStatus 
}) => {
  return (
    <>{children}</>
  );
};

export const useNetworkStatusContext = () => {
  const networkStatus = useNetworkStatus({
    showToasts: true,
    testInterval: 30000,
    testEndpoint: 'https://www.google.com'
  });
  
  return networkStatus;
};

export default NetworkStatusProvider;
