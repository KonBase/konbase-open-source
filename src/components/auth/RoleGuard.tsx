
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserProfile, UserRole } from '@/hooks/useUserProfile';
import { Spinner } from '@/components/ui/spinner';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallbackPath = '/unauthorized' 
}: RoleGuardProps) {
  const { profile, loading } = useUserProfile();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}
