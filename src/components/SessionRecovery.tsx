import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';
import { getLastVisitedPath, getSavedSessionData } from '@/utils/session-utils';
import { useAuth } from '@/contexts/auth';

/**
 * Component that handles session recovery when a user returns to the app
 * This helps prevent 404 errors by redirecting users to their last path
 */
export const SessionRecovery = () => {
  const { session, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAttemptedRecovery = useRef(false);
  const isProcessingAuth = useRef(false);
  const isGitHubPages = window.location.hostname.includes('github.io');

  useEffect(() => {
    // Only attempt recovery once per component lifecycle
    if (hasAttemptedRecovery.current || isProcessingAuth.current) return;
    
    const attemptSessionRecovery = async () => {
      // Skip if already authenticated (session exists) or still loading
      if (session || loading) return;
      
      try {
        // Check if we're already on a public route that doesn't need recovery
        const isPublicRoute = 
          location.pathname === '/' || 
          location.pathname === '/login' || 
          location.pathname === '/register' ||
          location.pathname.includes('/auth/callback') ||
          location.pathname.includes('/forgot-password') ||
          location.pathname.includes('/reset-password') ||
          // For HashRouter paths (#/route)
          location.hash.includes('/login') ||
          location.hash.includes('/register');
          
        if (isPublicRoute) {
          hasAttemptedRecovery.current = true;
          return;
        }
        
        isProcessingAuth.current = true;
        logDebug('Starting session recovery attempt', { 
          path: location.pathname, 
          hash: location.hash,
          isGitHubPages
        }, 'info');
        
        // Check if we have saved session data
        const sessionData = getSavedSessionData();
        if (!sessionData) {
          logDebug('No saved session data found, redirecting to login', null, 'info');
          navigate('/login', { replace: true });
          hasAttemptedRecovery.current = true;
          isProcessingAuth.current = false;
          return;
        }
        
        // Get the last path the user visited
        const lastPath = getLastVisitedPath();
        
        // If we have session data but no active session, we might need recovery
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // If we have a session or successfully restored one, redirect to last path if needed
        if (data?.session) {
          logDebug('Session recovered successfully', null, 'info');
          
          // If we're not on a valid route, redirect to last known path or dashboard
          // For HashRouter, check both pathname and hash
          const currentPath = isGitHubPages ? location.hash.replace('#', '') : location.pathname;
          
          if (currentPath !== lastPath) {
            const redirectTo = lastPath || '/dashboard';
            logDebug('Redirecting to recovered path', { path: redirectTo }, 'info');
            
            // Small delay to ensure all auth state is updated
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
              isProcessingAuth.current = false;
            }, 100);
          } else {
            isProcessingAuth.current = false;
          }
        } else {
          // No valid session found, redirect to login
          logDebug('No valid session found during recovery, redirecting to login', null, 'info');
          navigate('/login', { replace: true });
          isProcessingAuth.current = false;
        }
      } catch (error) {
        handleError('Session recovery failed', error);
        navigate('/login', { replace: true });
        isProcessingAuth.current = false;
      }
      
      // Mark that we've attempted recovery
      hasAttemptedRecovery.current = true;
    };

    attemptSessionRecovery();
  }, [session, loading, location.pathname, location.hash, navigate, user]);

  return null;
};
