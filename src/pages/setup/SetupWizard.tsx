
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Users, Building, Loader2 } from 'lucide-react';

const SetupWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: ''
  });
  const [userAssociations, setUserAssociations] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchUserAssociations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('associations')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setUserAssociations(data || []);
      } catch (error) {
        console.error('Error fetching associations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load associations',
          variant: 'destructive'
        });
      }
    };
    
    fetchUserAssociations();
  }, [user, toast]);
  
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
      await supabase
        .from('association_members')
        .insert({
          user_id: user?.id,
          association_id: data.id,
          role: 'admin'
        });
      
      toast({
        title: 'Association Created',
        description: `${data.name} has been created successfully`
      });
      
      // Update user profile with the association ID
      await supabase
        .from('profiles')
        .update({ association_id: data.id })
        .eq('id', user?.id);
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating association:', error);
      toast({
        title: 'Failed to Create Association',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinAssociation = async (associationId: string) => {
    try {
      // Update user profile with the association ID
      await supabase
        .from('profiles')
        .update({ association_id: associationId })
        .eq('id', user?.id);
      
      toast({
        title: 'Association Joined',
        description: 'You have successfully joined the association'
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error joining association:', error);
      toast({
        title: 'Failed to Join Association',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
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
            <CardContent className="pt-6">
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
        
        <TabsContent value="join" className="mt-6">
          <Card>
            <CardContent className="pt-6">
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
              
              <div className="w-full border-t mt-6 pt-4">
                <p className="text-sm text-muted-foreground mb-2">Have an invitation code?</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter invitation code" className="flex-1" />
                  <Button variant="outline">Join</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupWizard;
