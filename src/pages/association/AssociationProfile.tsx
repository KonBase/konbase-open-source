
import React from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const associationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  address: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address."),
  contactPhone: z.string().optional(),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  logo: z.string().optional(),
});

type AssociationFormValues = z.infer<typeof associationSchema>;

const AssociationProfile = () => {
  const { currentAssociation, updateAssociation, isLoading } = useAssociation();
  
  const form = useForm<AssociationFormValues>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      name: currentAssociation?.name || '',
      description: currentAssociation?.description || '',
      address: currentAssociation?.address || '',
      contactEmail: currentAssociation?.contactEmail || '',
      contactPhone: currentAssociation?.contactPhone || '',
      website: currentAssociation?.website || '',
      logo: currentAssociation?.logo || '',
    }
  });

  const onSubmit = async (values: AssociationFormValues) => {
    try {
      await updateAssociation(values);
      toast({
        title: "Profile Updated",
        description: "Your association profile has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "There was a problem updating your association profile.",
        variant: "destructive"
      });
    }
  };

  if (!currentAssociation) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Association Found</CardTitle>
            <CardDescription>You need to set up your association first</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with EventNexus, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup">Set Up Association</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Association Profile</h1>
          <p className="text-muted-foreground">Manage your association's information.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Association Details</CardTitle>
          <CardDescription>
            Update your association's information displayed to members and on conventions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Association Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe your association..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Association Logo</CardTitle>
          <CardDescription>Upload your association's logo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="border rounded-md p-2 w-32 h-32 flex items-center justify-center bg-muted">
              {currentAssociation.logo ? (
                <img 
                  src={currentAssociation.logo} 
                  alt="Association logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Building2 className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <div>
              <Button variant="outline" className="mb-2">
                Upload New Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended size: 400x400 pixels. Max file size: 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssociationProfile;
