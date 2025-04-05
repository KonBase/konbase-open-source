
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { UserRoleType } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoleGuardProps {
  allowedRoles: UserRoleType[];
  children: ReactNode;
  fallbackPath?: string;
  enforceTwoFactor?: boolean;
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallbackPath = '/unauthorized',
  enforceTwoFactor = false
}: RoleGuardProps) {
  const { userProfile, hasRole, isLoading, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);
      
      if (isLoading) return;

      // Debug output to verify role checking
      console.log('Checking role access:', {
        userProfile,
        userRole: userProfile?.role,
        allowedRoles,
        isAuthenticated,
        hasAllowedRole: userProfile ? allowedRoles.some(role => hasRole(role)) : false
      });
      
      // Check if user is authenticated first
      if (!isAuthenticated || !userProfile) {
        console.error("Access denied: User is not authenticated or profile not loaded");
        setHasAccess(false);
        setChecking(false);
        
        toast({
          title: "Authentication Required",
          description: "Please log in to access this area.",
          variant: "destructive"
        });
        
        return;
      }
      
      // First check if user has any of the allowed roles
      const hasAllowedRole = allowedRoles.some(role => hasRole(role));
      
      if (!hasAllowedRole) {
        setHasAccess(false);
        setChecking(false);
        
        // Display error message in console for debugging
        console.error(`Access denied: User with role ${userProfile?.role} attempted to access a resource requiring one of these roles: ${allowedRoles.join(', ')}`);
        
        // Show toast here instead of in a separate useEffect
        toast({
          title: "Access Denied",
          description: "You don't have sufficient permissions to access this area.",
          variant: "destructive"
        });
        
        return;
      }
      
      // For high-privilege roles or when explicit 2FA enforcement is needed,
      // check if the user has 2FA enabled
      const needsTwoFactor = (
        hasRole('super_admin') || 
        hasRole('system_admin') || 
        enforceTwoFactor
      );
      
      if (needsTwoFactor && userProfile && !userProfile.two_factor_enabled) {
        setShowTwoFactorDialog(true);
        setHasAccess(false);
        setChecking(false);
        return;
      }
      
      // All checks passed
      setHasAccess(true);
      setChecking(false);
    };
    
    checkAccess();
  }, [isLoading, userProfile, allowedRoles, hasRole, enforceTwoFactor, toast, isAuthenticated]);
  
  if (isLoading || checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  if (showTwoFactorDialog) {
    return (
      <AlertDialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              For enhanced security, Two-Factor Authentication (2FA) is required to access
              these privileged functions. Would you like to set up 2FA now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate(fallbackPath)}>
              Cancel Access
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/settings?tab=security')}>
              Set Up 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}
