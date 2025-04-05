
import { supabase } from '@/integrations/supabase/client';
import { User, UserRoleType } from '@/types/user';

/**
 * Fetches the user profile data from Supabase
 * @param userId The user ID to fetch the profile for
 * @returns The user profile data or null if not found
 */
export const fetchUserProfile = async (userId: string) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching user profile:', error);
    return null;
  }
};

/**
 * Enhances a Supabase user with profile data
 * @param user The Supabase user object
 * @param profileData The profile data from the profiles table
 * @returns An enhanced user object
 */
export const enhanceUserWithProfile = (user: User, profileData: any) => {
  if (!user || !profileData) return user;
  
  return {
    ...user,
    name: profileData.name || profileData.email?.split('@')[0] || 'User',
    profileImage: profileData.profile_image,
    role: profileData.role as UserRoleType || 'guest',
    email: user.email || profileData.email
  };
};

/**
 * Checks if session is valid and not expired
 * @param session The session object
 * @returns True if the session is valid, false otherwise
 */
export const isSessionValid = (session: any) => {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || session.expiresAt;
  
  return expiresAt > now;
};
