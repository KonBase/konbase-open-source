
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
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
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking email verification:", error);
          setIsChecking(false);
          return;
        }
        
        if (data?.user?.email_confirmed_at) {
          setIsEmailVerified(true);
        } else {
          setIsEmailVerified(false);
          
          toast({
            title: "Email Verification Required",
            description: "Please check your inbox and verify your email before continuing.",
            variant: "destructive"
          });
          
          // Sign out user with unverified email
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Only check email verification if the user is logged in
    if (!isLoading) {
      if (isAuthenticated && user) {
        checkEmailVerification();
      } else {
        setIsChecking(false);
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Use replace to avoid back button issues
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/login" state={{ emailVerification: true }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
