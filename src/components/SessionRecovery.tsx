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
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAttemptedRecovery = useRef(false);

  useEffect(() => {
    // Only attempt recovery once per component lifecycle
    if (hasAttemptedRecovery.current) return;
    
    const attemptSessionRecovery = async () => {
      // Skip if already authenticated (session exists) or still loading
      if (session || loading) return;
      
      try {
        // Check if we're already on a public route that doesn't need recovery
        const isPublicRoute = 
          location.pathname === '/' || 
          location.pathname === '/login' || 
          location.pathname === '/register' ||
          location.pathname.includes('/auth/callback');
          
        if (isPublicRoute) return;
        
        // Check if we have saved session data
        const sessionData = getSavedSessionData();
        if (!sessionData) return;
        
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
          if (!isPublicRoute && location.pathname !== lastPath) {
            const redirectTo = lastPath || '/dashboard';
            navigate(redirectTo, { replace: true });
          }
        }
      } catch (error) {
        handleError('Session recovery failed', error);
      }
      
      // Mark that we've attempted recovery
      hasAttemptedRecovery.current = true;
    };

    attemptSessionRecovery();
  }, [session, loading, location.pathname, navigate]);

  return null;
};
