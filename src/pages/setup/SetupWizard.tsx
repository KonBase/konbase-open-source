
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Key, Plus, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SetupHeader from '@/components/setup/SetupHeader';
import InvitationCodeForm from '@/components/setup/InvitationCodeForm';
import AssociationForm from '@/components/setup/AssociationForm';
import { useEffect, useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SetupWizard = () => {
  const navigate = useNavigate();
  const { currentAssociation, isLoading } = useAssociation();
  const { userProfile, user } = useAuth();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  
  // Redirect if user already has an association or when setup is completed
  useEffect(() => {
    if (!isLoading && (currentAssociation || setupCompleted)) {
      toast({
        title: "Setup completed",
        description: "Redirecting you to dashboard..."
      });
      navigate('/dashboard');
    }
  }, [currentAssociation, isLoading, setupCompleted, navigate]);
  
  // Update user role to 'admin' when creating an association
  const updateUserRole = async () => {
    if (!user) return;
    
    try {
      setIsUpdatingRole(true);
      
      // First update the profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Create audit log for the role update
      await supabase
        .from('audit_logs')
        .insert({
          action: 'role_update',
          entity: 'profiles',
          entity_id: user.id,
          user_id: user.id,
          changes: { role: 'admin', previous_role: userProfile?.role || 'guest' }
        });
      
      console.log('User role updated to admin');
      
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Generate invitation code for others to join
  const generateInvitationCode = async () => {
    if (!currentAssociation || !user) return;

    try {
      // Generate a random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Save it to the database
      const { error } = await supabase
        .from('association_invitations')
        .insert({
          code,
          association_id: currentAssociation.id,
          role: 'member',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        });
      
      if (error) throw error;
      
      setInvitationCode(code);
      
    } catch (error) {
      console.error('Error generating invitation code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invitation code',
        variant: 'destructive'
      });
    }
  };

  const copyInviteCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      toast({
        title: 'Copied',
        description: 'Invitation code copied to clipboard',
      });
    }
  };
  
  // Handlers for successful setup
  const handleAssociationCreated = async () => {
    await updateUserRole();
    setSetupCompleted(true);
  };
  
  const handleAssociationJoined = () => {
    setSetupCompleted(true);
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <SetupHeader />
      
      {invitationCode ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invitation Code Generated</CardTitle>
            <CardDescription>Share this code with others to join your association</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Share this code with others to join your association:
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2 p-2 mt-4 bg-background border rounded-md">
              <span className="font-mono text-lg font-bold flex-1">{invitationCode}</span>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              The code will expire in 7 days. The user will need to sign up or log in to use this code.
            </p>
            <div className="mt-4">
              <Button onClick={() => navigate('/dashboard')}>
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="invitation" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="invitation" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Use Invitation Code
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Association
            </TabsTrigger>
          </TabsList>

          {/* Invitation Code Tab */}
          <TabsContent value="invitation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Join with Invitation Code</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InvitationCodeForm onSuccess={handleAssociationJoined} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Create New Tab */}
          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Association</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AssociationForm onSuccess={async () => {
                  await handleAssociationCreated();
                  await generateInvitationCode();
                }} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SetupWizard;
