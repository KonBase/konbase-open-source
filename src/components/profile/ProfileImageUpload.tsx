
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2, UserCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

export const ProfileImageUpload: React.FC = () => {
  const { profile, updateProfile, user } = useUserProfile();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update the user profile with the new image URL
      const { success, error } = await updateProfile({
        profile_image: publicUrlData.publicUrl
      });

      if (!success) {
        throw new Error(error || 'Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Profile image updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error uploading image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {profile?.profile_image ? (
            <AvatarImage src={profile.profile_image} alt={profile.name} />
          ) : (
            <AvatarFallback>
              <UserCircle2 className="h-12 w-12" />
            </AvatarFallback>
          )}
        </Avatar>
        <Button
          variant="outline" 
          size="icon"
          className="absolute bottom-0 right-0 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadImage}
        className="hidden"
        disabled={uploading}
      />

      {profile?.name && (
        <p className="text-lg font-medium">{profile.name}</p>
      )}
      {profile?.email && (
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      )}
    </div>
  );
};
