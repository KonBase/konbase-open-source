
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { REQUIRED_SQL_FIXES } from '@/lib/supabase-sql-helpers';

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
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [hasAttemptedSqlFix, setHasAttemptedSqlFix] = useState(false);

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
              
              if (err.message?.includes('infinite recursion') && !hasAttemptedSqlFix) {
                setHasAttemptedSqlFix(true);
                
                toast({
                  title: "Database Configuration Required",
                  description: "Please run the SQL fix in supabase-sql-helpers.ts to resolve the infinite recursion error.",
                  variant: "destructive"
                });
              }
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
      setError(null);
      
      // Use maybeSingle instead of single to handle the case where no profile is found
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        // Log the error but don't throw if it's the infinite recursion error
        if (error.message?.includes('infinite recursion')) {
          console.error('RLS policy error (this needs SQL fix):', error);
          
          // For infinite recursion errors, try to create/use a default profile
          if (user?.email) {
            handleDefaultProfile(userId, user.email);
          } else {
            setLoading(false);
          }
          
          return;
        }
        
        // If the error is because the profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.warn(`No profile found for user ID: ${userId}, creating default profile`);
          
          if (user?.email) {
            handleDefaultProfile(userId, user.email);
          } else {
            setLoading(false);
          }
          
          return;
        }

        console.error('Error loading profile:', error);
        setError(new Error(error.message));
        toast({
          title: "Profile Error",
          description: "Could not load your profile information.",
          variant: "destructive"
        });
      } else if (data) {
        // Ensure role is treated as UserRole type
        const profileData: Profile = {
          ...data,
          role: data.role as UserRole
        };
        setProfile(profileData);
      } else {
        // No profile found and no error, create a default one
        if (user?.email) {
          handleDefaultProfile(userId, user.email);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create and use a default profile
  const handleDefaultProfile = (userId: string, email: string) => {
    // Create a properly typed object for client-side use
    const defaultProfile = {
      id: userId,
      email: email,
      name: email.split('@')[0] || "User",
      role: 'guest' as UserRole,
      association_id: null,
      profile_image: null,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Set the profile state with our default values
    setProfile(defaultProfile as Profile);
    
    // Try to create the profile in the database silently
    // but don't block the UI on this operation
    supabase
      .from('profiles')
      .insert(defaultProfile)
      .then(({ error: insertError }) => {
        if (insertError && !insertError.message?.includes('infinite recursion')) {
          console.error('Error creating default profile:', insertError);
        }
      });
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
    error,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
