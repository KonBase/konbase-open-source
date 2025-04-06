
/**
 * Utility function for logging debug information to the console
 */
export const logDebug = (
  message: string, 
  data?: any, 
  level: 'log' | 'info' | 'warn' | 'error' = 'log'
) => {
  // Only log in development environment
  if (import.meta.env.DEV) {
    const logMessage = `[DEBUG] ${message}`;
    
    switch (level) {
      case 'log':
        console.log(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }
};
