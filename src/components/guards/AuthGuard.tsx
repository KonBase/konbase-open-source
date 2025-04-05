
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user, userProfile } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
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
    
    // Only check email verification if the user is logged in
    if (!isLoading) {
      logDebug('Auth state check complete', { isAuthenticated, userId: user?.id }, 'debug');
      if (isAuthenticated && user) {
        checkEmailVerification();
      } else {
        setIsChecking(false);
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  // Check if we're on the setup page - this prevents the infinite redirection loop
  const isSetupPage = location.pathname === '/setup';
  
  // Special case for allowing SetupWizard component to bypass RLS issues
  // This enables users to create associations even if the RLS policy is causing issues
  if (isSetupPage && isAuthenticated && !isLoading && !isChecking && userProfile) {
    // Setup page should only be accessible when authenticated
    return <>{children}</>;
  }

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
    // Use replace to avoid back button issues
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified) {
    logDebug('Redirecting user with unverified email to login', { email: user?.email }, 'info');
    return <Navigate to="/login" state={{ emailVerification: true }} replace />;
  }

  logDebug('User authenticated and email verified, rendering protected content', { userId: user?.id }, 'debug');
  return <>{children}</>;
};

export default AuthGuard;
