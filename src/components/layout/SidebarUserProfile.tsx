
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SidebarUserProfileProps {
  collapsed: boolean;
}

const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({ collapsed }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  if (!user) return null;

  // Extract user display values with fallbacks
  const userName = user?.name || profile?.name || 'User';
  const userEmail = user?.email || profile?.email || '';
  const userInitial = userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';

  // In collapsed mode, just show the avatar
  if (collapsed) {
    return (
      <div className="p-4 border-t border-border flex justify-center">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarUserProfile;
