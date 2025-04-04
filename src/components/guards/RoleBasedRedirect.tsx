
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAssociation } from '@/contexts/AssociationContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Component that redirects users based on their role and association status
 */
export function RoleBasedRedirect() {
  const { profile, loading } = useUserProfile();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || associationLoading) return;
    
    // If user is admin or super_admin, redirect to admin panel
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      navigate('/admin');
      return;
    }

    // If user has no association, redirect to setup wizard
    if (profile && !profile.association_id && !currentAssociation) {
      toast({
        title: "Association Required",
        description: "You need to set up or join an association to continue.",
      });
      navigate('/setup');
      return;
    }
  }, [profile, loading, currentAssociation, associationLoading, navigate]);

  return null;
}
