
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/debug';

const InvitationCodeForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  
  const handleInvitationCode = async () => {
    if (!invitationCode.trim()) {
      toast({
        title: 'Missing Code',
        description: 'Please enter an invitation code',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessingInvite(true);
    
    try {
      // Check if code exists in association_invitations
      const { data: invitation, error: invitationError } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('code', invitationCode.trim())
        .single();
      
      if (invitationError || !invitation) {
        toast({
          title: 'Invalid Invitation Code',
          description: 'The code you entered is invalid or has expired',
          variant: 'destructive'
        });
        setIsProcessingInvite(false);
        return;
      }
      
      // Check if code is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        toast({
          title: 'Expired Invitation Code',
          description: 'This invitation code has expired',
          variant: 'destructive'
        });
        setIsProcessingInvite(false);
        return;
      }
      
      // Use invitation role or default to member
      const memberRole = invitation.role || 'member';
      
      // Add user to association with the role from the invitation
      const memberResult = await supabase
        .from('association_members')
        .insert({
          user_id: user?.id,
          association_id: invitation.association_id,
          role: memberRole
        });
      
      if (memberResult.error) throw memberResult.error;
      
      // Update user profile with the association ID and role
      const profileResult = await supabase
        .from('profiles')
        .update({ 
          association_id: invitation.association_id,
          role: memberRole
        })
        .eq('id', user?.id);
      
      if (profileResult.error) throw profileResult.error;
      
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        entity: 'association_members',
        entity_id: user?.id,
        action: 'join',
        changes: `Joined association via invitation code with role "${memberRole}"`
      });
      
      // Get association name for the success message
      const { data: association } = await supabase
        .from('associations')
        .select('name')
        .eq('id', invitation.association_id)
        .single();
      
      toast({
        title: 'Association Joined',
        description: `You have successfully joined ${association?.name || 'the association'} as a ${memberRole}`
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'InvitationCodeForm.handleInvitationCode');
      toast({
        title: 'Failed to Process Invitation',
        description: error.message || 'An error occurred while processing your invitation',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingInvite(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Enter the invitation code you received to join an association.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="invitationCode">Invitation Code</Label>
        <div className="flex gap-2">
          <Input
            id="invitationCode"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            placeholder="Enter your invitation code"
            className="flex-1"
          />
          <Button 
            onClick={handleInvitationCode}
            disabled={isProcessingInvite || !invitationCode.trim()}
          >
            {isProcessingInvite ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Join'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The invitation code determines which association you join and your role within it.
        </p>
      </div>
    </div>
  );
};

export default InvitationCodeForm;
