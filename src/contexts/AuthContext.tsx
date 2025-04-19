import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { getSupabaseClient, initializeSupabaseClient } from '@/lib/supabase';
// Import loadConfig instead of getConfig
import { loadConfig } from '@/lib/config-store'; 

// ... (Keep existing type definitions: AuthContextType, UserProfile, etc.) ...
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  // Use the correct Supabase type for credentials
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<void>; 
  signOut: () => Promise<void>;
  reinitializeClient: () => void;
}

interface UserProfile {
  // Define structure based on your 'profiles' table
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string; // Assuming you have a role column
  // Add other profile fields as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state, supabaseClient can be null initially
  const [supabaseClient, setSupabaseClient] = useState(() => getSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Function to fetch user profile (remains the same)
  const fetchUserProfile = async (userId: string) => {
    if (!supabaseClient) return; // Don't fetch if client not ready
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data as UserProfile);
    } catch (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      setUserProfile(null); // Reset profile on error
    }
  };

  useEffect(() => {
    // Only run auth checks if the client is initialized
    if (!supabaseClient) {
      setLoading(false); // Not configured, stop loading
      return;
    }

    setLoading(true);
    // Check initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    }).catch(err => {
        console.error("Error getting session:", err);
        setError(err as AuthError);
        setLoading(false);
    });

    // Set up auth state listener
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserProfile(currentUser.id);
        } else {
          setUserProfile(null); // Clear profile on logout
        }
        setLoading(false); // Update loading state on change
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabaseClient]); // Re-run effect if supabaseClient changes

  // Update signInWithPassword to use the correct type
  const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
    if (!supabaseClient) {
      setError({ name: 'ConfigError', message: 'Supabase not configured.' } as AuthError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Pass credentials directly
      const { error } = await supabaseClient.auth.signInWithPassword(credentials);
      if (error) throw error;
      // Session update will be handled by onAuthStateChange
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  // signOut function remains the same
  const signOut = async () => {
    if (!supabaseClient) {
        setError({ name: 'ConfigError', message: 'Supabase not configured.' } as AuthError);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      // State updates (session, user, profile) handled by onAuthStateChange
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  // reinitializeClient function remains the same
  const reinitializeClient = () => {
    const client = initializeSupabaseClient();
    setSupabaseClient(client); // Update state, triggering useEffect
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    error,
    signInWithPassword,
    signOut,
    reinitializeClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook remains the same
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
