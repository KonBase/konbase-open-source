
import { useMobileDetect } from './useMobileDetect';
import { useIsMobile as useIsMobileBasic } from './use-mobile';

export function useResponsive() {
  // Get the detailed device info
  const deviceInfo = useMobileDetect();
  
  // Get the simple mobile check (for backward compatibility)
  const isMobileBasic = useIsMobileBasic();
  
  return {
    ...deviceInfo,
    // Additional helper functions
    belowSm: deviceInfo.screenWidth < 640,
    belowMd: deviceInfo.screenWidth < 768,
    belowLg: deviceInfo.screenWidth < 1024,
    belowXl: deviceInfo.screenWidth < 1280,
    below2xl: deviceInfo.screenWidth < 1536,
    
    // Check if we're on a specific breakpoint
    isXs: deviceInfo.breakpoint === 'xs',
    isSm: deviceInfo.breakpoint === 'sm',
    isMd: deviceInfo.breakpoint === 'md',
    isLg: deviceInfo.breakpoint === 'lg',
    isXl: deviceInfo.breakpoint === 'xl',
    is2xl: deviceInfo.breakpoint === '2xl',
    
    // Check if we're in a range of breakpoints
    isMobileOrTablet: deviceInfo.isMobile || deviceInfo.isTablet,
    isPortrait: deviceInfo.orientation === 'portrait',
    isLandscape: deviceInfo.orientation === 'landscape',
  };
}
