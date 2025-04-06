
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoleType } from '@/types/user';
import { handleError, logDebug } from '@/utils/debug';

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
}

export interface AssociationMember {
  id: string;
  user_id: string;
  association_id: string;
  role: UserRoleType;
  created_at: string;
  profile?: ProfileData;
}

/**
 * Hook to manage association members
 */
export const useAssociationMembers = (associationId: string) => {
  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Fetch all members of an association
   */
  const fetchMembers = useCallback(async () => {
    if (!associationId) return;
    
    setLoading(true);
    try {
      logDebug('Fetching association members', { associationId });
      
      const { data, error } = await supabase
        .from('association_members')
        .select(`
          id, 
          user_id, 
          association_id, 
          role, 
          created_at,
          profiles:user_id(id, name, email, profile_image)
        `)
        .eq('association_id', associationId);
        
      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedMembers = data.map(member => {
        // Handle profile data safely
        let profile: ProfileData | undefined = undefined;
        
        if (member.profiles && !('error' in member.profiles)) {
          profile = {
            id: member.profiles.id,
            name: member.profiles.name,
            email: member.profiles.email,
            profile_image: member.profiles.profile_image,
          };
        }
        
        return {
          id: member.id,
          user_id: member.user_id,
          association_id: member.association_id,
          role: member.role as UserRoleType,
          created_at: member.created_at,
          profile
        };
      });
      
      setMembers(transformedMembers);
    } catch (error) {
      handleError(error, 'useAssociationMembers.fetchMembers');
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  /**
   * Update a member's role
   */
  const updateMemberRole = async (memberId: string, role: UserRoleType) => {
    try {
      logDebug('Updating member role', { memberId, role });
      
      const { error } = await supabase
        .from('association_members')
        .update({ role })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId ? { ...member, role } : member
        )
      );
      
      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully.',
      });
      
      return { success: true };
    } catch (error) {
      handleError(error, 'useAssociationMembers.updateMemberRole');
      
      toast({
        title: 'Failed to update role',
        description: 'There was an error updating the member role.',
        variant: 'destructive',
      });
      
      return { success: false, error };
    }
  };

  /**
   * Remove a member from the association
   */
  const removeMember = async (memberId: string) => {
    try {
      logDebug('Removing member', { memberId });
      
      const { error } = await supabase
        .from('association_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the association.',
      });
      
      return { success: true };
    } catch (error) {
      handleError(error, 'useAssociationMembers.removeMember');
      
      toast({
        title: 'Failed to remove member',
        description: 'There was an error removing the member.',
        variant: 'destructive',
      });
      
      return { success: false, error };
    }
  };

  return {
    members,
    loading,
    fetchMembers,
    updateMemberRole,
    removeMember
  };
};
