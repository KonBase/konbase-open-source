import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { useAssociation } from '@/contexts/AssociationContext';
import { Association } from '@/types/association';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { Building2 } from 'lucide-react'; // Import icon for fallback

// Schema matches the Association type more closely
const associationProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  address: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address."),
  contactPhone: z.string().optional(),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  // logo: z.string().optional(), // Logo handling might need a separate upload mechanism
});

type AssociationProfileFormValues = z.infer<typeof associationProfileSchema>;

const AssociationProfile = () => {
  // Use the context hook - Removed error destructuring
  const { currentAssociation, isLoading: isAssociationLoading, updateAssociation } = useAssociation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize the form
  const form = useForm<AssociationProfileFormValues>({
    resolver: zodResolver(associationProfileSchema),
    // Set default values based on currentAssociation when it loads
    defaultValues: React.useMemo(() => ({
      name: currentAssociation?.name || '',
      description: currentAssociation?.description || '',
      address: currentAssociation?.address || '',
      contactEmail: currentAssociation?.contactEmail || '',
      contactPhone: currentAssociation?.contactPhone || '',
      website: currentAssociation?.website || '',
      // logo: currentAssociation?.logo || '',
    }), [currentAssociation]),
  });

  // Reset form when currentAssociation changes
  React.useEffect(() => {
    if (currentAssociation) {
      form.reset({
        name: currentAssociation.name || '',
        description: currentAssociation.description || '',
        address: currentAssociation.address || '',
        contactEmail: currentAssociation.contactEmail || '',
        contactPhone: currentAssociation.contactPhone || '',
        website: currentAssociation.website || '',
        // logo: currentAssociation.logo || '',
      });
    }
  }, [currentAssociation, form]);

  // Loading state
  if (isAssociationLoading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  // Check currentAssociation from context
  if (!currentAssociation) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>No Association Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You need to join or create an association.</p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link to="/setup/association">Set Up Association</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Handle form submission
  const onSubmit = async (values: AssociationProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // Map form values to the structure expected by updateAssociation
      const updateData: Partial<Association> = {
        name: values.name,
        description: values.description,
        address: values.address,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        website: values.website,
        // logo: values.logo, // Add logo update logic if needed
      };
      await updateAssociation(updateData);
      // Toast is handled within updateAssociation on success/error
      form.reset(values); // Reset form with submitted values to clear dirty state
    } catch (error) {
      // Error toast is handled within updateAssociation
      console.error("Submission error caught in component:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          {/* Add currentAssociation.logo when available */}
          <AvatarImage src={currentAssociation?.logo || undefined} alt={`${currentAssociation?.name} logo`} />
          <AvatarFallback>
            <Building2 className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentAssociation?.name || "Association Profile"}</h1>
          <p className="text-muted-foreground">View and update your association details.</p>
        </div>
      </div>

      {/* Form Section */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic details about the association.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Association Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Association Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your association" {...field} value={field.value ?? ''} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
              <CardDescription>How to reach the association.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {/* Contact Email Field */}
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@association.org" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Phone Field */}
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Field */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Association St, City, Country" {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Website Field */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://association.org" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>

          {/* Logo Field - Placeholder for potential future implementation */}
          {/* <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>URL of the association logo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

        </form>
      </Form>
    </div>
  );
};

export default AssociationProfile;
