
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { UserRoleType } from '@/types/user';
import { toast } from '@/components/ui/use-toast';
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
  const { userProfile, hasRole, loading, checkRoleAccess } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);
      
      if (loading) return;
      
      // First check if user has any of the allowed roles
      const hasAllowedRole = allowedRoles.some(role => hasRole(role));
      
      if (!hasAllowedRole) {
        setHasAccess(false);
        setChecking(false);
        return;
      }
      
      // For super_admin, or when explicit 2FA enforcement is needed,
      // check if the user has 2FA enabled
      if (
        (hasRole('super_admin') || enforceTwoFactor) && 
        userProfile && 
        !userProfile.two_factor_enabled
      ) {
        setShowTwoFactorDialog(true);
        setHasAccess(false);
        setChecking(false);
        return;
      }
      
      // For the highest required role in the list, perform a detailed access check
      let highestRequiredRole: UserRoleType = 'guest';
      for (const role of allowedRoles) {
        if (hasRole(role) && role === 'super_admin') {
          highestRequiredRole = 'super_admin';
          break;
        } else if (hasRole(role) && role === 'admin' && highestRequiredRole !== 'super_admin') {
          highestRequiredRole = 'admin';
        } else if (hasRole(role) && role === 'manager' && 
          highestRequiredRole !== 'super_admin' && highestRequiredRole !== 'admin') {
          highestRequiredRole = 'manager';
        }
      }
      
      if (highestRequiredRole !== 'guest') {
        const access = await checkRoleAccess(highestRequiredRole);
        setHasAccess(access);
      } else {
        // Default check for 'member' and 'guest'
        setHasAccess(true);
      }
      
      setChecking(false);
    };
    
    checkAccess();
  }, [loading, userProfile, allowedRoles, hasRole, checkRoleAccess, enforceTwoFactor]);
  
  if (loading || checking) {
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
    toast({
      title: "Access Denied",
      description: "You don't have sufficient permissions to access this area.",
      variant: "destructive"
    });
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}
