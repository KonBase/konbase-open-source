import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { UserPlus } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['member', 'manager']),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMemberDialog = ({ onInviteSent }: { onInviteSent?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const handleInvite = async (values: FormValues) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, you would generate an invitation code and send an email
      // For demonstration, we'll simulate this process
      
      // Create a record for the invitation
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser) {
        // Add user directly to association_members
        const { error } = await supabase.from('association_members').insert({
          user_id: existingUser.id,
          association_id: currentAssociation.id,
          role: values.role,
        });
        
        if (error) throw error;
        
        toast({
          title: 'Member Added',
          description: `${values.email} has been added to the association.`,
        });
      } else {
        // Simulated invitation (in a real app you would send an email with the code)
        toast({
          title: 'Invitation Sent',
          description: `Invitation code ${inviteCode} generated for ${values.email}.`,
        });
      }
      
      setIsOpen(false);
      if (onInviteSent) onInviteSent();
      form.reset();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Association Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your association.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="member" id="member" />
                        <Label htmlFor="member">Member</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manager" id="manager" />
                        <Label htmlFor="manager">Manager</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
