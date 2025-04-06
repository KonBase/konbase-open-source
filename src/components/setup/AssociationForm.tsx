
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Association name must be at least 2 characters.' }),
  description: z.string().optional(),
  contact_email: z.string().email({ message: 'Please enter a valid email address.' }),
  contact_phone: z.string().optional(),
  website: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssociationFormProps {
  onSuccess?: () => void;
}

const AssociationForm = ({ onSuccess }: AssociationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      contact_email: user?.email || '',
      contact_phone: '',
      website: '',
      address: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to create an association.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert the new association
      const { data: associationData, error: associationError } = await supabase
        .from('associations')
        .insert({
          name: values.name,
          description: values.description,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          website: values.website,
          address: values.address,
        })
        .select()
        .single();

      if (associationError) throw associationError;

      // Add the current user as an admin member of the association
      const { error: memberError } = await supabase
        .from('association_members')
        .insert({
          association_id: associationData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'create_association',
        entity: 'associations',
        entity_id: associationData.id,
        user_id: user.id,
        changes: values,
      });

      toast({
        title: 'Association created',
        description: `${values.name} has been successfully created.`,
      });

      // Call the success callback if provided
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error creating association:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create association. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Association Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter association name" {...field} />
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
                  placeholder="Briefly describe your association"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input placeholder="contact@example.com" type="email" {...field} />
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
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input placeholder="123 Main St, City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Association'}
        </Button>
      </form>
    </Form>
  );
};

export default AssociationForm;
