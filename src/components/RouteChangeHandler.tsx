import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Get previous path from sessionStorage (if available)
    const previousPath = sessionStorage.getItem('kb_previous_path') || '';
    const currentPath = location.pathname;
    
    // Add current path to navigation history 
    addToNavigationHistory(currentPath);

    // Check if we're navigating between major sections of the app 
    if (isMainSectionChange(previousPath, currentPath)) {
      logDebug('Main section change detected', {
        from: previousPath,
        to: currentPath
      }, 'info');

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
        
        // If we're coming from dashboard to settings (a common problem case),
        // force a clean state transition
        if (previousPath.includes('/dashboard') && currentPath.includes('/settings')) {
          // Small delay to ensure the navigation completes first
          setTimeout(() => {
            // Dispatch event to notify components about the section change
            window.dispatchEvent(new CustomEvent('force-section-refresh', {
              detail: {
                targetSection: 'settings'
              }
            }));
          }, 10);
        }
      }
    }

    // Update previous path in session storage for next navigation
    sessionStorage.setItem('kb_previous_path', currentPath);
  }, [location.pathname, navigate, lastTransition]);

  return null; // This component doesn't render anything
};

export default RouteChangeHandler;