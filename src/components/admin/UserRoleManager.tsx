
import { useState } from 'react';
import { useUserProfile, UserRole } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRole;
  onRoleUpdated?: () => void;
}

export function UserRoleManager({ 
  userId, 
  currentRole, 
  onRoleUpdated 
}: UserRoleManagerProps) {
  const { profile } = useUserProfile();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Check if current user has permission to change roles
  const canChangeRoles = profile?.role === 'super_admin' || profile?.role === 'admin';
  
  // Only super_admins can create other super_admins
  const canCreateSuperAdmin = profile?.role === 'super_admin';
  
  const availableRoles: UserRole[] = canCreateSuperAdmin 
    ? ['super_admin', 'admin', 'manager', 'member', 'guest'] 
    : ['admin', 'manager', 'member', 'guest'];

  const updateUserRole = async () => {
    if (!canChangeRoles || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Update the user's role in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Also update any association_members entries if they exist
      await supabase
        .from('association_members')
        .update({ role })
        .eq('user_id', userId);
      
      // Create an audit log entry
      await supabase.from('audit_logs').insert({
        action: 'update_role',
        entity: 'profiles',
        entity_id: userId,
        user_id: profile?.id,
        changes: { old_role: currentRole, new_role: role }
      });
      
      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Role Updated',
          message: `Your role has been updated to ${role}`,
          read: false
        });
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${role}`,
      });
      
      if (onRoleUpdated) onRoleUpdated();
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (!canChangeRoles) {
    return <div className="text-sm text-muted-foreground">{currentRole}</div>;
  }
  
  return (
    <div className="flex gap-2 items-center">
      <Select
        value={role}
        onValueChange={(value) => setRole(value as UserRole)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((roleOption) => (
            <SelectItem key={roleOption} value={roleOption}>
              {roleOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        size="sm"
        variant="outline"
        onClick={updateUserRole}
        disabled={isUpdating || role === currentRole}
      >
        {isUpdating ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}
