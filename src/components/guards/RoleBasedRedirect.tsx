import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';

interface RoleBasedRedirectProps {
  component: ReactNode;
  allowedRoles: UserRoleType[];
  redirectTo: string;
}

export const RoleBasedRedirect = ({ component, allowedRoles, redirectTo }: RoleBasedRedirectProps) => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      // Check if user has one of the allowed roles
      const hasAllowedRole = allowedRoles.includes(userProfile.role as UserRoleType);
      
      if (!hasAllowedRole) {
        navigate(redirectTo);
      }
    }
  }, [userProfile, loading, allowedRoles, redirectTo, navigate]);

  return <>{component}</>;
};
