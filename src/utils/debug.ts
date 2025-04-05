
/**
 * Debug utility functions for improved error handling and debugging
 */

export const DEBUG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
} as const;

type DebugLevel = typeof DEBUG_LEVELS[keyof typeof DEBUG_LEVELS];

const isDebugMode = () => {
  return process.env.NODE_ENV !== 'production' || localStorage.getItem('konbase-debug') === 'true';
};

/**
 * Enhanced console logging with timestamp and level
 */
export const logDebug = (message: string, data?: any, level: DebugLevel = 'debug') => {
  if (!isDebugMode() && level !== 'error') return;
  
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(formattedMessage, data);
      break;
    case 'warn':
      console.warn(formattedMessage, data);
      break;
    case 'info':
      console.info(formattedMessage, data);
      break;
    case 'debug':
    case 'trace':
    default:
      console.log(formattedMessage, data);
  }
};

/**
 * Error handler with detailed logging
 */
export const handleError = (error: any, context: string = 'general'): string => {
  let errorMessage = 'An unknown error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = error.message as string;
  }
  
  logDebug(`Error in ${context}: ${errorMessage}`, {
    error,
    stack: error instanceof Error ? error.stack : undefined,
    context
  }, 'error');
  
  return errorMessage;
};

/**
 * Performance measurement utility
 */
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    logDebug(`Performance: ${operationName} took ${(endTime - startTime).toFixed(2)}ms`, null, 'info');
    return result;
  } catch (error) {
    const endTime = performance.now();
    logDebug(`Performance: ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms`, error, 'error');
    throw error;
  }
};

/**
 * Enable debug mode in localStorage
 */
export const enableDebugMode = (enable: boolean = true) => {
  if (enable) {
    localStorage.setItem('konbase-debug', 'true');
    logDebug('Debug mode enabled', null, 'info');
  } else {
    localStorage.removeItem('konbase-debug');
    console.log('Debug mode disabled');
  }
};

/**
 * Utility to trace component renders
 */
export const traceRender = (componentName: string, props?: any) => {
  if (!isDebugMode()) return;
  logDebug(`Component rendered: ${componentName}`, props, 'trace');
};

/**
 * Helper to log auth state changes
 */
export const logAuthEvent = (event: string, data?: any) => {
  logDebug(`Auth event: ${event}`, data, 'info');
};

export default {
  logDebug,
  handleError,
  measurePerformance,
  enableDebugMode,
  traceRender,
  logAuthEvent,
  DEBUG_LEVELS
};
