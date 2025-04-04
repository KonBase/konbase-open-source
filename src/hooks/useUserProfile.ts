
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member' | 'guest';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  association_id: string | null;
  profile_image: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get the current session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error in getSession:', error);
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Using setTimeout to break potential circular dependencies in Supabase callbacks
          setTimeout(() => {
            fetchProfile(session.user.id).catch(err => {
              console.error('Error fetching profile during auth state change:', err);
            });
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Cleanup subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      // Use single to handle the case where no profile is found
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        // If the error is because the profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.warn(`No profile found for user ID: ${userId}, creating default profile`);
          
          if (user?.email) {
            // Create a properly typed object for insertion
            const defaultProfile = {
              id: userId,
              email: user.email,
              name: user.email.split('@')[0] || "User",
              role: 'guest' as UserRole,
              association_id: null,
              profile_image: null,
              two_factor_enabled: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Try to create the profile in the database
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(defaultProfile);
              
            if (!insertError) {
              setProfile(defaultProfile as Profile);
            } else {
              console.error('Error creating default profile:', insertError);
              toast({
                title: "Profile Error",
                description: "Could not create a profile for your account.",
                variant: "destructive"
              });
            }
          }
        } else {
          console.error('Error loading profile:', error);
          toast({
            title: "Profile Error",
            description: "Could not load your profile information.",
            variant: "destructive"
          });
        }
      } else if (data) {
        // Ensure role is treated as UserRole type
        const profileData: Profile = {
          ...data,
          role: data.role as UserRole
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'role'>>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh the profile data
      await fetchProfile(user.id);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    profile,
    loading,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
