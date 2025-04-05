
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/hooks/useUserProfile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { CheckCircle, UserPlus } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AddUserToAssociationProps {
  associationId: string;
  onUserAdded?: () => void;
}

export function AddUserToAssociation({ associationId, onUserAdded }: AddUserToAssociationProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const { profile } = useUserProfile();
  
  const resetForm = () => {
    setEmail('');
    setRole('member');
    setStatus('idle');
    setErrorMessage('');
  };
  
  const handleAddUser = async () => {
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('email', email.trim())
        .maybeSingle();
      
      if (userError) throw userError;
      
      if (!userData) {
        setErrorMessage('User not found. Please enter a valid email address.');
        setStatus('error');
        return;
      }
      
      // Check if user is already a member of the association
      const { data: existingMembership, error: membershipError } = await supabase
        .from('association_members')
        .select('*')
        .eq('user_id', userData.id)
        .eq('association_id', associationId)
        .maybeSingle();
      
      if (membershipError) throw membershipError;
      
      if (existingMembership) {
        setErrorMessage('User is already a member of this association.');
        setStatus('error');
        return;
      }
      
      // Get association details to use in notification
      const { data: associationData } = await supabase
        .from('associations')
        .select('name')
        .eq('id', associationId)
        .single();
      
      // Add user to association with specified role
      const { error: addError } = await supabase
        .from('association_members')
        .insert({
          user_id: userData.id,
          association_id: associationId,
          role,
        });
      
      if (addError) throw addError;
      
      // Update the user's profile to set this association as their current association if they don't have one
      const { data: profileData } = await supabase
        .from('profiles')
        .select('association_id')
        .eq('id', userData.id)
        .single();
        
      if (!profileData.association_id) {
        await supabase
          .from('profiles')
          .update({ association_id: associationId })
          .eq('id', userData.id);
      }
      
      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: userData.id,
          title: 'Association Membership',
          message: `You have been added to ${associationData?.name || 'an association'} with the role of ${role}`,
          read: false
        });
      
      // Log this action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'add_member',
          entity: 'association_members',
          entity_id: associationId,
          user_id: profile?.id || '',
          changes: {
            user_id: userData.id,
            association_id: associationId,
            role: role
          }
        });
      
      toast({
        title: 'User added to association',
        description: `${userData.name || email} has been added with the role of ${role}`,
      });
      
      setStatus('success');
      
      // Call callback if provided
      if (onUserAdded) {
        onUserAdded();
      }
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error adding user to association:', error);
      setErrorMessage(error.message || 'Failed to add user to association');
      setStatus('error');
    }
  };
  
  return (
    <Dialog onOpenChange={(open) => !open && resetForm()}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User to Association</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to add to this association.
          </DialogDescription>
        </DialogHeader>
        
        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="font-medium text-lg">User Added Successfully</h3>
            <p className="text-sm text-muted-foreground">
              {email} has been added to the association.
            </p>
            <DialogClose asChild>
              <Button className="mt-4">Close</Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  placeholder="user@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  disabled={status === 'loading'}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleAddUser}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
