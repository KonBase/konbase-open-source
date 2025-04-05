
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserRoleType, USER_ROLES } from '@/types/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRoleType;
  onRoleUpdated?: () => void;
}

export function UserRoleManager({ 
  userId, 
  currentRole, 
  onRoleUpdated 
}: UserRoleManagerProps) {
  const { userProfile, hasRole } = useAuth();
  const [role, setRole] = useState<UserRoleType>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Check if current user has permission to change roles
  const canChangeRoles = hasRole('admin');
  
  // Only super_admins can create other super_admins
  const canCreateSuperAdmin = hasRole('super_admin');
  
  const availableRoles: UserRoleType[] = canCreateSuperAdmin 
    ? ['super_admin', 'admin', 'manager', 'member', 'guest'] 
    : ['admin', 'manager', 'member', 'guest'];

  const showTwoFactorWarning = role === 'super_admin';

  const updateUserRole = async () => {
    if (!canChangeRoles || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Update the user's role in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Also update any association_members entries if they exist
      const { error: memberError } = await supabase
        .from('association_members')
        .update({ role })
        .eq('user_id', userId);
      
      if (memberError) {
        console.log('Note: No association memberships to update or error occurred:', memberError);
      }
      
      // Create an audit log entry
      await supabase.from('audit_logs').insert({
        action: 'update_role',
        entity: 'profiles',
        entity_id: userId,
        user_id: userProfile?.id,
        changes: { old_role: currentRole, new_role: role }
      });
      
      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Role Updated',
          message: `Your role has been updated to ${USER_ROLES[role].name}`,
          read: false
        });
      
      // Show special warning if setting to super_admin
      if (role === 'super_admin') {
        toast({
          title: "Super Admin role assigned",
          description: "This user will need to enable 2FA to access super admin functions.",
          variant: "warning"
        });
      } else {
        toast({
          title: "Role updated",
          description: `User role has been updated to ${USER_ROLES[role].name}`,
        });
      }
      
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
    return <div className="text-sm text-muted-foreground">{USER_ROLES[currentRole].name}</div>;
  }
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRoleType)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((roleOption) => (
              <SelectItem key={roleOption} value={roleOption}>
                {USER_ROLES[roleOption].name}
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
      
      {showTwoFactorWarning && (
        <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p>Super Admin requires 2FA</p>
        </div>
      )}
    </div>
  );
}
