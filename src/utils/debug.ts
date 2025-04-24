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
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : ''; // Stringify data for sending

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
        // Send error to local logging endpoint
        fetch('/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp,
            level,
            message,
            data: logData, // Send stringified data
            stack: new Error().stack // Optionally capture stack trace
          }),
        }).catch(console.error); // Log fetch errors to console
        break;
    }
  }
};

/**
 * Utility function for handling and logging errors
 */
export const handleError = (error: any, source: string): string => {
  const errorMessage = error?.message || String(error) || 'Unknown error';
  logDebug(`Error in ${source}: ${errorMessage}`, error, 'error');
  return errorMessage;
};

/**
 * Utility function to enable debug mode
 */
export const enableDebugMode = (enabled: boolean = true): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('konbase-debug-mode', enabled ? 'true' : 'false');
    logDebug(`Debug mode ${enabled ? 'enabled' : 'disabled'}`, null, 'info');
  }
};

/**
 * Utility function to check if debug mode is enabled
 */
export const isDebugModeEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('konbase-debug-mode') === 'true';
  }
  return false;
};
