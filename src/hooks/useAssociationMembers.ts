
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AssociationMember {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  joinedAt: string;
}

export function useAssociationMembers() {
  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (currentAssociation) {
      fetchMembers();
    } else {
      setMembers([]);
      setLoading(false);
    }
  }, [currentAssociation]);

  const fetchMembers = async () => {
    if (!currentAssociation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('association_members')
        .select(`
          user_id,
          role,
          created_at,
          profiles:user_id (
            id,
            name,
            email,
            profile_image
          )
        `)
        .eq('association_id', currentAssociation.id)
        .order('created_at');

      if (error) throw error;

      const formattedMembers: AssociationMember[] = data.map(member => ({
        id: member.user_id,
        name: member.profiles.name,
        email: member.profiles.email,
        role: member.role,
        profileImage: member.profiles.profile_image,
        joinedAt: member.created_at,
      }));

      setMembers(formattedMembers);
    } catch (error: any) {
      console.error('Error fetching association members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load association members.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    if (!currentAssociation) return false;

    try {
      const { error } = await supabase
        .from('association_members')
        .update({ role })
        .match({ 
          association_id: currentAssociation.id, 
          user_id: memberId 
        });

      if (error) throw error;

      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role } 
            : member
        )
      );

      toast({
        title: 'Role Updated',
        description: 'Member role has been updated successfully.',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member role.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!currentAssociation) return false;
    if (memberId === user?.id) {
      toast({
        title: 'Error',
        description: 'You cannot remove yourself from the association.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('association_members')
        .delete()
        .match({ 
          association_id: currentAssociation.id, 
          user_id: memberId 
        });

      if (error) throw error;

      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));

      toast({
        title: 'Member Removed',
        description: 'Member has been removed from the association.',
      });

      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const checkInvitationCode = async (code: string): Promise<{valid: boolean, role?: string, email?: string}> => {
    try {
      const { data, error } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('code', code)
        .eq('association_id', currentAssociation?.id)
        .single();

      if (error) {
        return { valid: false };
      }

      if (data) {
        // Check if invitation is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          return { valid: false };
        }
        
        return { 
          valid: true, 
          role: data.role,
          email: data.email
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Error checking invitation code:', error);
      return { valid: false };
    }
  };

  const acceptInvitation = async (code: string): Promise<boolean> => {
    if (!user || !currentAssociation) return false;

    try {
      // Check invitation validity
      const inviteCheck = await checkInvitationCode(code);
      if (!inviteCheck.valid) {
        toast({
          title: 'Invalid Invitation',
          description: 'The invitation code is invalid or expired.',
          variant: 'destructive'
        });
        return false;
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('association_members')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('association_id', currentAssociation.id)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingMember) {
        toast({
          title: 'Already a Member',
          description: 'You are already a member of this association.',
          variant: 'destructive'
        });
        return false;
      }

      // Add user to association
      const { error: addError } = await supabase
        .from('association_members')
        .insert({
          user_id: user.id,
          association_id: currentAssociation.id,
          role: inviteCheck.role || 'member', // Default to member if role is not specified
        });

      if (addError) throw addError;

      // Delete the used invitation
      await supabase
        .from('association_invitations')
        .delete()
        .eq('code', code)
        .eq('association_id', currentAssociation.id);

      toast({
        title: 'Success',
        description: 'You have successfully joined the association.',
      });

      await fetchMembers();
      return true;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation.',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    members,
    loading,
    refreshMembers: fetchMembers,
    updateMemberRole,
    removeMember,
    checkInvitationCode,
    acceptInvitation
  };
}
