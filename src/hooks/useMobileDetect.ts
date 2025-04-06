import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  screenWidth: number;
}

export function useMobileDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: width,
      });
    };

    // Run once on mount
    handleResize();

    // Add event listener for resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}
