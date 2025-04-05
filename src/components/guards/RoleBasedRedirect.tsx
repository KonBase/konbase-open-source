
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { toast } from '@/components/ui/use-toast';
import { UserRoleType } from '@/types/user';

/**
 * Component that redirects users based on their role and association status
 */
export function RoleBasedRedirect() {
  const { userProfile, hasRole, loading } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || associationLoading) return;
    
    // Get current path
    const currentPath = location.pathname;
    
    // If user is admin or super_admin, redirect to admin panel
    // unless they're already on an admin path or specific pages
    const adminOrAssociationPaths = [
      '/admin', 
      '/association', 
      '/profile', 
      '/settings',
      '/dashboard'
    ];
    
    const isOnAllowedPath = adminOrAssociationPaths.some(path => 
      currentPath.startsWith(path)
    );
    
    if (hasRole('admin') && 
        currentPath === '/' && !isOnAllowedPath) {
      toast({
        title: "Admin Access",
        description: "Welcome to your admin dashboard.",
      });
      navigate('/admin');
      return;
    }

    // If user has the guest role and no association, redirect to setup wizard
    // unless they're already on a setup or admin path
    if (userProfile && 
        userProfile.role === 'guest' && 
        !userProfile.association_id && 
        !currentAssociation && 
        !currentPath.startsWith('/setup') && 
        !currentPath.startsWith('/admin')) {
      toast({
        title: "Association Required",
        description: "You need to set up or join an association to continue.",
      });
      navigate('/setup');
      return;
    }
  }, [userProfile, loading, currentAssociation, associationLoading, navigate, location, hasRole]);

  return null;
}
