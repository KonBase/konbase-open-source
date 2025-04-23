import React, { useState } from 'react'; // Moved useState import here
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAssociation } from '@/contexts/AssociationContext'; // Import useAssociation
import { useUserProfile } from '@/hooks/useUserProfile'; // Import useUserProfile
import { useToast } from '@/components/ui/use-toast'; // Import useToast for feedback
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const AssociationSetup: React.FC = () => {
  // Placeholder state and handlers
  const [inviteCode, setInviteCode] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [contactEmail, setContactEmail] = useState(''); // Add state for contact email
  const [isJoining, setIsJoining] = useState(true); // Toggle between Join and Create
  const [isLoading, setIsLoading] = useState(false);
  const { createAssociation } = useAssociation(); // Get createAssociation from context
  const { profile } = useUserProfile(); // Get user profile
  const { toast } = useToast(); // Get toast function
  const navigate = useNavigate(); // Get navigate function

  const handleJoin = async () => {
    setIsLoading(true);
    console.log('Attempting to join association with code:', inviteCode);
    // TODO: Implement logic to validate invite code and join association
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setIsLoading(false);
    // On success, navigate to dashboard or relevant page
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
    console.log('Attempting to create association:', associationName, 'with email:', contactEmail);
    try {
      // Pass both name and contactEmail to createAssociation
      const newAssociation = await createAssociation({ name: associationName, contactEmail: contactEmail });

      if (newAssociation) {
        toast({
          title: 'Success',
          description: `Association "${newAssociation.name}" created successfully!`,
        });
        // On success, navigate to the dashboard or the new association's page
        // Assuming the context automatically sets the new association as current
        navigate('/dashboard'); // Or navigate(`/association/${newAssociation.id}`) or similar
      } else {
        // createAssociation handles its own errors/toasts, but we can add a fallback
        toast({
          title: 'Error',
          description: 'Failed to create association. Please check logs or try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // Catch any unexpected errors from the hook itself
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
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invitation Code</Label>
              <Input 
                id="inviteCode" 
                placeholder="Enter code..." 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <> {/* Use Fragment to group multiple elements */}
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
              {/* Add input field for contact email */}
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
            <Button onClick={handleJoin} disabled={isLoading || !inviteCode} className="w-full">
              {isLoading ? 'Joining...' : 'Join Association'}
            </Button>
          ) : (
            // Update disabled condition to include contactEmail
            <Button onClick={handleCreate} disabled={isLoading || !associationName || !contactEmail} className="w-full">
              {isLoading ? 'Creating...' : 'Create Association'}
            </Button>
          )}
          <Button 
            variant="link" 
            onClick={() => setIsJoining(!isJoining)} 
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
