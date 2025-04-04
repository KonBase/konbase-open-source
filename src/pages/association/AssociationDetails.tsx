import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssociation } from '@/contexts/AssociationContext';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AssociationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAssociation, updateAssociation } = useAssociation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [association, setAssociation] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  
  useEffect(() => {
    const fetchAssociation = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // If the id matches our current association, use that data
        if (currentAssociation && currentAssociation.id === id) {
          setAssociation(currentAssociation);
          setName(currentAssociation.name);
          setDescription(currentAssociation.description || '');
          setContactEmail(currentAssociation.contactEmail);
          setContactPhone(currentAssociation.contactPhone || '');
          setWebsite(currentAssociation.website || '');
          setAddress(currentAssociation.address || '');
          setIsLoading(false);
          return;
        }
        
        // Otherwise, fetch from Supabase
        const { data, error } = await supabase
          .from('associations')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const formattedData = {
            id: data.id,
            name: data.name,
            description: data.description || '',
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone || '',
            website: data.website || '',
            address: data.address || '',
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
          
          setAssociation(formattedData);
          setName(formattedData.name);
          setDescription(formattedData.description);
          setContactEmail(formattedData.contactEmail);
          setContactPhone(formattedData.contactPhone);
          setWebsite(formattedData.website);
          setAddress(formattedData.address);
        }
      } catch (error) {
        console.error('Error fetching association:', error);
        toast({
          title: 'Error',
          description: 'Failed to load association details',
          variant: 'destructive',
        });
        navigate('/association');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssociation();
  }, [id, currentAssociation, navigate]);
  
  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      await updateAssociation({
        name,
        description,
        contactEmail,
        contactPhone,
        website,
        address
      });
      
      toast({
        title: 'Success',
        description: 'Association details updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update association details',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/association')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-36" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(null).map((_, i) => (
              <div className="space-y-2" key={i}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/association')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{association?.name}</h1>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Association Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Association Information</CardTitle>
              <CardDescription>
                Update your association's details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Association Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter association name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your association"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="contact@association.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://association.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Association address"
                />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(association?.updatedAt).toLocaleDateString()}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Association Members</CardTitle>
              <CardDescription>
                Manage the members of your association and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Member management will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Categories</CardTitle>
              <CardDescription>
                Manage categories for organizing your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Category management will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Manage storage locations for your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Location management will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssociationDetails;
