import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { isMainSectionChange, addToNavigationHistory, setNavigationState } from '@/utils/session-utils';

/**
 * RouteChangeHandler monitors route changes and ensures proper state management during navigation
 * It helps fix issues where navigating between sections (like dashboard to settings) requires a refresh
 */
const RouteChangeHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lastTransition, setLastTransition] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const pendingNavigationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip processing on initial mount to avoid interference with initial page load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Store initial path in navigation history
      addToNavigationHistory(location.pathname);
      return;
    }

    // Get previous path from sessionStorage (if available)
    const previousPath = sessionStorage.getItem('kb_previous_path') || '';
    const currentPath = location.pathname;
    
    // Add current path to navigation history 
    addToNavigationHistory(currentPath);
    
    // Clear any pending navigation timeouts
    if (pendingNavigationRef.current) {
      clearTimeout(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }

    // Check if we're navigating between major sections of the app 
    if (isMainSectionChange(previousPath, currentPath)) {
      if (isDebugModeEnabled()) {
        logDebug('Main section change detected', {
          from: previousPath,
          to: currentPath
        }, 'info');
      }

      // Set navigation state to help with debugging
      setNavigationState('navigating');
      
      // Record this transition to prevent duplicate handling
      const transitionKey = `${previousPath}=>${currentPath}`;
      if (lastTransition !== transitionKey) {
        setLastTransition(transitionKey);
        
        // This helps ensure components re-mount when switching between major sections
        // Fixes the issue where content doesn't update properly when navigating
        window.dispatchEvent(new CustomEvent('route-section-changed', {
          detail: { 
            previousPath, 
            currentPath,
            timestamp: Date.now()
          }
        }));
        
        // Handle transitions between specific sections that are known to cause issues
        handleSpecificTransitions(previousPath, currentPath);
      }
    }

    // Always update previous path in session storage for next navigation
    sessionStorage.setItem('kb_previous_path', currentPath);
    
    // Set navigation state back to idle after a short delay
    pendingNavigationRef.current = setTimeout(() => {
      setNavigationState('idle');
    }, 500);
    
    // Clean up timeout on unmount
    return () => {
      if (pendingNavigationRef.current) {
        clearTimeout(pendingNavigationRef.current);
      }
    };
  }, [location.pathname, lastTransition]);

  /**
   * Handle transitions between specific sections that are known to cause issues
   */
  const handleSpecificTransitions = (previousPath: string, currentPath: string) => {
    // Dashboard to settings transition (common problem case)
    if (previousPath.includes('/dashboard') && currentPath.includes('/settings')) {
      // Dispatch event to notify components about the section change
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-section-refresh', {
          detail: {
            targetSection: 'settings'
          }
        }));
      }, 50);
    }
    
    // Settings to dashboard transition
    if (previousPath.includes('/settings') && currentPath.includes('/dashboard')) {
      // Dispatch event to notify dashboard to reload fresh data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboard-reload-requested', {
          detail: {
            timestamp: Date.now()
          }
        }));
      }, 50);
    }
    
    // Inventory section transitions
    if (currentPath.includes('/inventory')) {
      // Dispatch event to notify inventory components to refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('inventory-section-changed', {
          detail: {
            path: currentPath
          }
        }));
      }, 50);
    }
  };

  return null; // This component doesn't render anything
};

export default RouteChangeHandler;