
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';

interface InvitationCodeFormProps {
  onSuccess?: () => void;
}

const InvitationCodeForm = ({ onSuccess }: InvitationCodeFormProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { setCurrentAssociation } = useAssociation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invitation code",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use an invitation code",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Lookup the invitation code
      const { data: invitation, error: invitationError } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('code', code.trim())
        .single();
      
      if (invitationError || !invitation) {
        throw new Error("Invalid invitation code");
      }
      
      // Check if invitation has expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error("This invitation code has expired");
      }
      
      // Check if user is already a member of this association
      const { data: existingMembership } = await supabase
        .from('association_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('association_id', invitation.association_id)
        .single();
      
      if (existingMembership) {
        // Get association details
        const { data: association } = await supabase
          .from('associations')
          .select('*')
          .eq('id', invitation.association_id)
          .single();
        
        if (association) {
          setCurrentAssociation({
            id: association.id,
            name: association.name,
            description: association.description,
            logo: association.logo,
            contactEmail: association.contact_email,
            contactPhone: association.contact_phone,
            website: association.website,
            address: association.address,
            createdAt: association.created_at,
            updatedAt: association.updated_at
          });
          
          toast({
            title: "Already a member",
            description: `You are already a member of ${association.name}`
          });
          
          // Call success callback
          onSuccess?.();
          return;
        }
      }
      
      // Add user to association members
      const { error: membershipError } = await supabase
        .from('association_members')
        .insert({
          user_id: user.id,
          association_id: invitation.association_id,
          role: invitation.role || 'member'
        });
      
      if (membershipError) {
        throw membershipError;
      }
      
      // Update user profile with association_id if they don't have one already
      const { data: profile } = await supabase
        .from('profiles')
        .select('association_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.association_id) {
        await supabase
          .from('profiles')
          .update({ association_id: invitation.association_id })
          .eq('id', user.id);
      }
      
      // Get association details
      const { data: association } = await supabase
        .from('associations')
        .select('*')
        .eq('id', invitation.association_id)
        .single();
      
      if (association) {
        setCurrentAssociation({
          id: association.id,
          name: association.name,
          description: association.description,
          logo: association.logo,
          contactEmail: association.contact_email,
          contactPhone: association.contact_phone,
          website: association.website,
          address: association.address,
          createdAt: association.created_at,
          updatedAt: association.updated_at
        });
      }
      
      toast({
        title: "Success",
        description: `You have joined ${association?.name || 'the association'}`
      });
      
      // Call success callback
      onSuccess?.();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to use invitation code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Invitation Code</Label>
        <Input
          id="code"
          placeholder="Enter invitation code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Joining...' : 'Join Association'}
      </Button>
    </form>
  );
};

export default InvitationCodeForm;
