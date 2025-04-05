
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRoleType } from '@/types/user';

interface RoleBasedRedirectProps {
  component: ReactNode;
  allowedRoles: UserRoleType[];
  redirectTo: string;
}

export const RoleBasedRedirect = ({ component, allowedRoles, redirectTo }: RoleBasedRedirectProps) => {
  const { userProfile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && userProfile) {
      // Check if user has one of the allowed roles
      const hasAllowedRole = allowedRoles.includes(userProfile.role as UserRoleType);
      
      if (!hasAllowedRole) {
        navigate(redirectTo);
      }
    }
  }, [userProfile, isLoading, allowedRoles, redirectTo, navigate]);

  return <>{component}</>;
};
