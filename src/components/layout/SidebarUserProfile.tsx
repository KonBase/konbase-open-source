
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SidebarUserProfileProps {
  collapsed: boolean;
}

const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({ collapsed }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  if (!user) return null;

  // In collapsed mode, just show the avatar
  if (collapsed) {
    return (
      <div className="p-4 border-t border-border flex justify-center">
        <Avatar className="h-8 w-8">
          {profile?.profile_image && (
            <AvatarImage src={profile.profile_image} alt={user.name || "User"} />
          )}
          <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {profile?.profile_image && (
            <AvatarImage src={profile.profile_image} alt={user.name || "User"} />
          )}
          <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || profile?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarUserProfile;
