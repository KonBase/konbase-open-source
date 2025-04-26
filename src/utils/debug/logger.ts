/**
 * Log debug information with optional context data
 * 
 * @param message The message to log
 * @param data Optional data to include with the log
 * @param level Log level (info, warn, error)
 */
export const logDebug = (
  message: string, 
  data: any = null, 
  level: 'info' | 'warn' | 'error' = 'info'
) => {
  // Only log in development or if debug mode is enabled
  const isDev = import.meta.env.NODE_ENV === 'development';
  const isDebugEnabled = localStorage.getItem('konbase_debug_mode') === 'true';
  
  if (!isDev && !isDebugEnabled) return;

  const logObject = {
    timestamp: new Date().toISOString(),
    message,
    data,
    level
  };

  switch (level) {
    case 'error':
      console.error(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
    case 'warn':
      console.warn(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
    case 'info':
    default:
      console.info(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
  }

  // You could also send logs to a service or store them in localStorage
  // for a debug panel to display
  const debugLogs = JSON.parse(localStorage.getItem('konbase_debug_logs') || '[]');
  debugLogs.push(logObject);
  
  // Keep only the last 100 logs
  if (debugLogs.length > 100) {
    debugLogs.shift();
  }
  
  localStorage.setItem('konbase_debug_logs', JSON.stringify(debugLogs));
};