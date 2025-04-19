import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';
import { getLastVisitedPath, getSavedSessionData } from '@/utils/session-utils';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that handles session recovery when a user returns to the app
 * This helps prevent 404 errors by redirecting users to their last path
 */
export const SessionRecovery = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const attemptSessionRecovery = async () => {
      // Skip if already authenticated (session exists) or still loading
      if (session || loading) return;
      
      try {
        // Check if we have saved session data
        const sessionData = getSavedSessionData();
        if (!sessionData) return;
        
        // Check if the session is fresh enough (within the last 24 hours)
        const isSessionRecent = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000;
        if (!isSessionRecent) return;
        
        // Check if we're on a 404 or public page
        const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
        const is404 = location.pathname === '/404' || location.key === 'default';
        
        if (is404 || isPublicRoute) {
          // Get current session, if user is already logged in we can redirect
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            const lastPath = getLastVisitedPath();
            logDebug('Restoring session navigation', { from: location.pathname, to: lastPath }, 'info');
            navigate(lastPath, { replace: true });
          }
        }
      } catch (error) {
        handleError(error, 'SessionRecovery.attemptSessionRecovery');
      }
    };

    attemptSessionRecovery();
  }, [session, loading, location, navigate]);

  return null; // This component doesn't render anything
};
