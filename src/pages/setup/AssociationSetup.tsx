import React, { useState, useEffect } from 'react'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAssociation } from '@/contexts/AssociationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CircleIcon } from 'lucide-react';

const AssociationSetup: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isJoining, setIsJoining] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const { createAssociation, joinAssociationWithCode } = useAssociation();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for invitation code in URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const codeFromUrl = queryParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
      checkInvitationCode(codeFromUrl);
    }
  }, [location]);

  const checkInvitationCode = async (code: string) => {
    try {
      // Look up the invitation details
      const { data, error } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;
      
      if (data) {
        // Check if code is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        if (now > expiresAt) {
          setInvitationDetails({ error: 'This invitation code has expired.' });
          return;
        }
        
        // Store the invitation details
        setInvitationDetails(data);
      } else {
        setInvitationDetails({ error: 'Invalid invitation code.' });
      }
    } catch (error: any) {
      console.error('Error checking invitation code:', error);
      setInvitationDetails({ error: 'Invalid invitation code.' });
    }
  };

  const handleJoin = async () => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'User profile not loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get invitation details if not already fetched
      if (!invitationDetails) {
        await checkInvitationCode(inviteCode);
      }
      
      // Check if there's an error with the invitation
      if (invitationDetails?.error) {
        toast({
          title: 'Invalid Invitation',
          description: invitationDetails.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Join the association
      const result = await joinAssociationWithCode(inviteCode, profile.id);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'You have successfully joined the association!',
        });
        
        // Update user role if specified in invitation
        if (invitationDetails?.role) {
          await supabase
            .from('profiles')
            .update({ role: invitationDetails.role })
            .eq('id', profile.id);
        }
        
        navigate('/dashboard');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to join association.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error joining association:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'User profile not loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    if (!associationName.trim()) {
      toast({
        title: 'Error',
        description: 'Association name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    // Add validation for contact email
    if (!contactEmail.trim() || !/\S+@\S+\.\S+/.test(contactEmail)) {
        toast({
            title: 'Error',
            description: 'Please enter a valid contact email address.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    try {
      // Pass both name and contactEmail to createAssociation
      const newAssociation = await createAssociation({ name: associationName, contactEmail: contactEmail });

      if (newAssociation) {
        toast({
          title: 'Success',
          description: `Association "${newAssociation.name}" created successfully!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create association. Please check logs or try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error during association creation process:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setInviteCode(code);
    
    // Auto-check invitation details when code is complete (6 chars)
    if (code.length >= 6) {
      checkInvitationCode(code);
    } else {
      setInvitationDetails(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isJoining ? 'Join Association' : 'Create Association'}</CardTitle>
          <CardDescription>
            {isJoining
              ? 'Enter an invitation code to join an existing association.'
              : 'Enter a name for your new association.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isJoining ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input 
                  id="inviteCode" 
                  placeholder="Enter code..." 
                  value={inviteCode}
                  onChange={handleInviteCodeChange}
                  disabled={isLoading}
                />
              </div>
              
              {/* Show invitation details if available */}
              {invitationDetails && !invitationDetails.error && (
                <Alert>
                  <CircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    You're joining <strong>{invitationDetails.association_id}</strong> with role: <strong>{invitationDetails.role || 'member'}</strong>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Show error if invitation is invalid */}
              {invitationDetails?.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {invitationDetails.error}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <> 
              <div className="space-y-2">
                <Label htmlFor="associationName">Association Name</Label>
                <Input
                  id="associationName"
                  placeholder="My Awesome Association"
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isJoining ? (
            <Button 
              onClick={handleJoin} 
              disabled={isLoading || !inviteCode || (invitationDetails && !!invitationDetails.error)} 
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Association'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={isLoading || !associationName || !contactEmail} 
              className="w-full"
            >
              {isLoading ? 'Creating...' : 'Create Association'}
            </Button>
          )}
          <Button 
            variant="link" 
            onClick={() => {
              setIsJoining(!isJoining);
              setInvitationDetails(null);
            }} 
            disabled={isLoading}
            className="text-sm"
          >
            {isJoining ? 'Or create a new association' : 'Or join with an invite code'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssociationSetup;
