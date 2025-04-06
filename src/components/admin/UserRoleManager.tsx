
import { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { UserRoleType } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { handleError } from '@/utils/debug';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRoleType;
  onRoleUpdated?: () => void;
  associationContext?: boolean;
}

export function UserRoleManager({ 
  userId, 
  currentRole, 
  onRoleUpdated,
  associationContext = false
}: UserRoleManagerProps) {
  const [role, setRole] = useState<UserRoleType>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const { safeUpdate } = useTypeSafeSupabase();

  const updateUserRole = async (newRole: UserRoleType) => {
    if (newRole === currentRole) return;
    
    setIsUpdating(true);
    try {
      // Update the user's role
      if (associationContext) {
        // Update in association_members table
        const { error } = await safeUpdate(
          'association_members',
          { role: newRole },
          { column: 'user_id', value: userId }
        );
        
        if (error) throw error;
      } else {
        // Update in profiles table
        const { error } = await safeUpdate(
          'profiles',
          { role: newRole },
          { column: 'id', value: userId }
        );
        
        if (error) throw error;
      }
      
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'update_role',
        entity: associationContext ? 'association_members' : 'profiles',
        entity_id: userId,
        user_id: user?.id,
        changes: `Changed role from ${currentRole} to ${newRole}`
      } as any);
      
      // Send a notification to the user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Role Updated',
        message: `Your role has been updated to ${newRole} by an administrator.`,
        read: false
      } as any);
      
      // Update the local state
      setRole(newRole);
      
      toast({
        title: 'Role Updated',
        description: `User role has been updated to ${newRole}`,
      });
      
      // Call the callback if provided
      if (onRoleUpdated) onRoleUpdated();
      
    } catch (error) {
      handleError(error, 'UserRoleManager.updateUserRole');
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Define which roles the current user can assign
  const getAssignableRoles = (): UserRoleType[] => {
    if (hasPermission('admin:all')) {
      return ['guest', 'member', 'manager', 'admin', 'system_admin', 'super_admin'];
    } else if (hasPermission('manage:users')) {
      return ['guest', 'member', 'manager', 'admin', 'system_admin'];
    } else if (hasPermission('manage:association')) {
      return ['guest', 'member', 'manager', 'admin'];
    } else {
      return ['guest', 'member', 'manager'];
    }
  };

  const assignableRoles = getAssignableRoles();

  return (
    <div className="flex items-center">
      <Select
        value={role}
        onValueChange={(value) => updateUserRole(value as UserRoleType)}
        disabled={isUpdating || userId === user?.id}
      >
        <SelectTrigger className="w-[120px] sm:w-[140px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {assignableRoles.map((role) => (
            <SelectItem key={role} value={role} className="capitalize">
              {role.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
