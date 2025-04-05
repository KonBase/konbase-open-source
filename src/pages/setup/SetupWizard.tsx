
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Users, Building, Loader2, Key } from 'lucide-react';
import { logDebug, handleError } from '@/utils/debug';

const SetupWizard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    website: '',
    address: ''
  });
  const [invitationCode, setInvitationCode] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateAssociation = async () => {
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the association
      const { data, error } = await supabase
        .from('associations')
        .insert({
          name: formData.name,
          description: formData.description,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          website: formData.website,
          address: formData.address
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the current user as an admin for this association
      const memberResult = await supabase
        .from('association_members')
        .insert({
          user_id: user?.id,
          association_id: data.id,
          role: 'admin'
        });
      
      if (memberResult.error) throw memberResult.error;
      
      // Update user profile with the association ID and promote from guest to admin
      const profileResult = await supabase
        .from('profiles')
        .update({ 
          association_id: data.id,
          role: 'admin'
        })
        .eq('id', user?.id);
      
      if (profileResult.error) throw profileResult.error;
      
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        entity: 'associations',
        entity_id: data.id,
        action: 'create',
        changes: `Created association "${data.name}"`
      });
      
      toast({
        title: 'Association Created',
        description: `${data.name} has been created successfully`
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'SetupWizard.handleCreateAssociation');
      toast({
        title: 'Failed to Create Association',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
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
      handleError(error, 'SetupWizard.handleInvitationCode');
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
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to KonBase</h1>
        <p className="text-muted-foreground">
          Get started by creating a new association or joining with an invitation code
        </p>
      </div>
      
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
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Association Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="E.g., Springfield Gaming Association"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your organization"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email*</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Physical address of your organization"
                    rows={2}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCreateAssociation}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Association
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupWizard;
