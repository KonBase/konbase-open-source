
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { RoleBasedRedirect } from './RoleBasedRedirect';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    // Check if email is verified
    const checkEmailVerification = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser?.email_confirmed_at) {
          setIsEmailVerified(true);
        } else {
          // Email not verified
          toast({
            title: "Email Verification Required",
            description: "Please check your inbox and verify your email before continuing.",
            variant: "destructive"
          });
          
          // Sign out the user
          await supabase.auth.signOut();
          
          setIsEmailVerified(false);
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
      }
      
      setIsChecking(false);
    };
    
    // Small delay to ensure auth state is properly loaded
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        checkEmailVerification();
      } else {
        setIsChecking(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

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

  // Add the role-based redirect component
  return (
    <>
      <RoleBasedRedirect />
      {children}
    </>
  );
};

export default AuthGuard;
