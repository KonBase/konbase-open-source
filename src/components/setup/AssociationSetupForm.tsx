import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import { loadConfig, SupabaseConfig } from '@/lib/config-store';
import { getSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AssociationSetupFormProps {
  onNext: () => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Association name must be at least 2 characters.' }),
  description: z.string().optional(),
  contact_email: z.string().email({ message: 'Please enter a valid email address.' }),
  contact_phone: z.string().optional(),
  website: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AssociationSetupForm: React.FC<AssociationSetupFormProps> = ({ onNext }) => {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);

  useEffect(() => {
    // Load config on mount
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      address: '',
    },
  });

  const createAssociation = async (values: FormValues) => {
    if (!config?.url || !config?.key) {
      setError('Supabase credentials not found. Please go back and configure the connection.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Get client using stored credentials
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client. Check configuration.');
      }

      // Create the association record
      const { data: associationData, error: associationError } = await supabase
        .from('associations')
        .insert({
          name: values.name,
          description: values.description || null,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone || null,
          website: values.website || null,
          address: values.address || null,
        })
        .select()
        .single();

      if (associationError) {
        throw new Error(`Association creation error: ${associationError.message}`);
      }

      if (!associationData || !associationData.id) {
        throw new Error('Failed to create association: No data returned');
      }

      // Create default categories
      const defaultCategories = [
        { name: 'Electronics', association_id: associationData.id },
        { name: 'Furniture', association_id: associationData.id },
        { name: 'Office Supplies', association_id: associationData.id },
        { name: 'Equipment', association_id: associationData.id },
      ];

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories);

      if (categoriesError) {
        console.warn('Warning: Failed to create default categories:', categoriesError.message);
        // Continue even if this fails
      }

      // Success!
      setSuccess(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error creating association');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create First Association</CardTitle>
        <CardDescription>
          Set up your first organization in KonBase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createAssociation)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Association Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Convention Org" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of your organization or convention group
                  </FormDescription>
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
                    <Textarea placeholder="Tell us about your organization..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 123 4567" {...field} />
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
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Your organization's address..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Association creation failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Association created successfully!</AlertTitle>
                <AlertDescription>
                  Default categories have also been added.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={creating || success}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Association...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Association
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
         <p className="text-sm text-muted-foreground">
           Define the primary association for this KonBase instance.
         </p>
        <Button
          onClick={onNext}
          disabled={creating || !success}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AssociationSetupForm;
