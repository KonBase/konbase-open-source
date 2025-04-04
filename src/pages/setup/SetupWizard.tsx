
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Users, Building } from 'lucide-react';

interface AssociationFormData {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
}

const SetupWizard = () => {
  const { profile } = useUserProfile();
  const { createAssociation, userAssociations } = useAssociation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<AssociationFormData>({
    name: '',
    description: '',
    contactEmail: profile?.email || '',
    contactPhone: '',
    website: '',
    address: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAssociation = async () => {
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: 'Required Fields',
        description: 'Please provide a name and contact email for the association',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const newAssociation = await createAssociation(formData);
      
      if (newAssociation) {
        toast({
          title: 'Association Created',
          description: `${newAssociation.name} has been created successfully.`,
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error creating association:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create the association',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinAssociation = async (associationId: string) => {
    // This functionality would typically require an invitation system
    // For now, we'll just redirect to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to KonBase</h1>
        <p className="text-muted-foreground">
          Let's set up your association to get started
        </p>
      </div>
      
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Association
          </TabsTrigger>
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Join Existing Association
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Association</CardTitle>
              <CardDescription>
                Set up your own organization to manage inventory and events
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              </form>
            </CardContent>
            <CardFooter>
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
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="join" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Join an Existing Association</CardTitle>
              <CardDescription>
                Join an organization you've been invited to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAssociations && userAssociations.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select an association to join:
                  </p>
                  {userAssociations.map(association => (
                    <Card key={association.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleJoinAssociation(association.id)}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{association.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {association.description || 'No description provided'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Associations Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't been invited to any existing associations yet.
                  </p>
                  <p className="text-sm">
                    You can create your own association using the "Create New Association" tab
                    or ask an administrator to invite you to their organization.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Have an invitation code?</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter invitation code" className="flex-1" />
                  <Button variant="outline">Join</Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupWizard;
