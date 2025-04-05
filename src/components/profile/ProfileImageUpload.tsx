
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export const ProfileImageUpload: React.FC = () => {
  const { profile } = useUserProfile();

  // Get the first letter of the user's name for the avatar fallback
  const userInitial = profile?.name && profile.name.length > 0 
    ? profile.name.charAt(0).toUpperCase() 
    : 'U';

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </div>

      {profile?.name && (
        <p className="text-lg font-medium">{profile.name}</p>
      )}
      {profile?.email && (
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      )}
    </div>
  );
};
