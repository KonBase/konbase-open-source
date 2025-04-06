
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';
import { saveCurrentPath, getLastVisitedPath } from '@/utils/session-utils';
import { UserRoleType } from '@/types/user';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRoleType[];
}

const AuthGuard = ({ children, requiredRoles }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user, userProfile, hasRole } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user) {
        setIsChecking(false);
        setIsEmailVerified(false);
        return;
      }

      try {
        logDebug(`Checking email verification for user: ${user.id}`, { email: user.email }, 'info');
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          handleError(error, 'AuthGuard.checkEmailVerification');
          setIsChecking(false);
          return;
        }
        
        // Check if email is verified from metadata
        const isVerified = data?.user?.email_confirmed_at || 
                          data?.user?.user_metadata?.email_verified || 
                          false;
        
        if (isVerified) {
          logDebug('Email verified', { 
            email: user.email, 
            confirmed_at: data.user.email_confirmed_at 
          }, 'info');
          setIsEmailVerified(true);
        } else {
          logDebug('Email not verified', { email: user.email }, 'warn');
          setIsEmailVerified(false);
          
          toast({
            title: "Email Verification Required",
            description: "Please check your inbox and verify your email before continuing.",
            variant: "destructive"
          });
          
          // Sign out user with unverified email
          try {
            await supabase.auth.signOut();
            logDebug('Signed out unverified user', { email: user.email }, 'info');
          } catch (error) {
            handleError(error, 'AuthGuard.signOutUnverifiedUser');
          }
        }
      } catch (error) {
        handleError(error, 'AuthGuard.checkEmailVerification');
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check if user has the required role
    const checkRoleAccess = () => {
      if (!userProfile || !requiredRoles || requiredRoles.length === 0) {
        setHasRequiredRole(true);
        return;
      }

      // Check if user has any of the required roles
      const hasAccess = requiredRoles.some(role => hasRole(role));
      setHasRequiredRole(hasAccess);

      if (!hasAccess) {
        logDebug('Access denied - insufficient role', { 
          userRole: userProfile.role,
          requiredRoles 
        }, 'warn');
        
        toast({
          title: "Access Denied",
          description: "You don't have sufficient permissions to access this area.",
          variant: "destructive"
        });
      }
    };
    
    // Only check email verification if the user is logged in
    if (!isLoading) {
      logDebug('Auth state check complete', { isAuthenticated, userId: user?.id }, 'info');
      if (isAuthenticated && user) {
        checkEmailVerification();
        checkRoleAccess();
      } else {
        setIsChecking(false);
      }
    }
  }, [isLoading, isAuthenticated, user, toast, userProfile, requiredRoles, hasRole]);

  // Save current path when location changes for authenticated users
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isChecking && user) {
      saveCurrentPath(location.pathname);
    }
  }, [location.pathname, isAuthenticated, isLoading, isChecking, user]);

  // Check if we're on the setup page - this prevents the infinite redirection loop
  const isSetupPage = location.pathname === '/setup';

  // Check if user has "guest" role and redirect to setup page
  // This is not in the check email verification flow because we want to redirect guests
  // even if they are already email verified
  if (!isLoading && !isChecking && isAuthenticated && userProfile?.role === 'guest' && !isSetupPage) {
    logDebug('Redirecting guest user to setup page', { userId: user?.id, role: userProfile?.role }, 'info');
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    logDebug('Redirecting unauthenticated user to login', { from: location.pathname }, 'info');
    // Save the intended destination if it's not a public route
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isEmailVerified) {
    logDebug('Redirecting user with unverified email to login', { email: user?.email }, 'info');
    return <Navigate to="/login" state={{ emailVerification: true }} replace />;
  }

  if (!hasRequiredRole && requiredRoles && requiredRoles.length > 0) {
    logDebug('Redirecting user due to insufficient role', { 
      userRole: userProfile?.role,
      requiredRoles
    }, 'info');
    return <Navigate to="/unauthorized" replace />;
  }

  logDebug('User authenticated, email verified, and has required role - rendering protected content', 
    { userId: user?.id, role: userProfile?.role }, 'info');
  return <>{children}</>;
};

export default AuthGuard;
