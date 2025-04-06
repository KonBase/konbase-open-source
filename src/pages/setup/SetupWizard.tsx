
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SetupHeader from '@/components/setup/SetupHeader';
import InvitationCodeForm from '@/components/setup/InvitationCodeForm';
import AssociationForm from '@/components/setup/AssociationForm';
import { useEffect, useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/lib/supabase';

const SetupWizard = () => {
  const navigate = useNavigate();
  const { currentAssociation, isLoading } = useAssociation();
  const { userProfile, user } = useAuth();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  
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
              <AssociationForm onSuccess={handleAssociationCreated} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupWizard;
