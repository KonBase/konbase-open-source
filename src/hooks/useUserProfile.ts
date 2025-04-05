
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

// Define the profile type with the expected fields
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: string;
  association_id?: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Export the UserRole type explicitly with the export type syntax to resolve TS error
export type { UserRole } from '@/types';

// Hook to get and update the user profile
export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the user profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update the user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user is authenticated');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile((prev) => prev ? { ...prev, ...data } : data);
      return { ...data, success: true, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  };

  // Update the profile image
  const updateProfileImage = async (imageUrl: string) => {
    return updateProfile({ profile_image: imageUrl });
  };

  // Initialize by fetching the profile when the user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateProfileImage,
    refreshProfile: fetchProfile,
    user // Add user to the return value to fix TypeScript errors
  };
};
