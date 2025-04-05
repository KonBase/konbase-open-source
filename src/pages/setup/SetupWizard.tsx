import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { processOAuthRedirect } from '@/lib/oauth-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

const SetupWizard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [processingOAuth, setProcessingOAuth] = useState(false);
  
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        setProcessingOAuth(true);
        try {
          const result = await processOAuthRedirect(location.hash);
          
          if (result.success) {
            window.history.replaceState(null, document.title, window.location.pathname);
            await refreshUser();
            
            toast({
              title: 'Authentication Successful',
              description: 'You have successfully signed in with your provider.'
            });
          } else {
            toast({
              title: 'Authentication Error',
              description: 'There was a problem with your authentication. Please try again.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error handling OAuth redirect:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete the authentication process.',
            variant: 'destructive'
          });
        } finally {
          setProcessingOAuth(false);
        }
      }
    };
    
    handleOAuthRedirect();
  }, [location.hash, refreshUser, toast]);
  
  if (processingOAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Spinner size="lg" />
            <p className="mt-4 text-lg font-medium">Processing your sign-in...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we complete your authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
