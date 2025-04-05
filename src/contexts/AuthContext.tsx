import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';
import { UserRoleType } from '@/types/user';

// Define the shape of the user profile object
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  association_id?: string | null;
  profile_image?: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Define the shape of the user profile update object
export interface UserProfileUpdate {
  name?: string;
  profile_image?: string | null;
  two_factor_enabled?: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Define the context type
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<{ data: any; error: any }>;
  loginWithGoogle: () => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (password: string) => Promise<{ data: any; error: any }>;
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  hasRole: (role: UserRoleType) => boolean;
  refreshUserProfile: () => Promise<UserProfile | null>; // Add this line
}

// Create the context with a default value of null
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export a hook for using the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Create the provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        if (initialSession?.user) {
          await loadUserProfile(initialSession.user.id);
        }
      } catch (error) {
        handleError(error, 'AuthProvider.loadSession');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        logDebug(`Auth state change event: ${event}`, { session: currentSession }, 'info');
        setSession(currentSession);
        
        if (currentSession?.user) {
          await loadUserProfile(currentSession.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );
    
    // Unsubscribe from auth state changes when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (profile) {
        logDebug(`User profile loaded`, { id: profile.id, role: profile.role }, 'info');
        setUserProfile(profile);
      } else {
        logDebug(`No profile found for user ${userId}`, null, 'warn');
        setUserProfile(null);
      }
    } catch (error) {
      handleError(error, 'AuthProvider.loadUserProfile');
      setUserProfile(null);
    }
  };
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      logDebug(`User logged in with email ${email}`, { userId: data.user?.id }, 'info');
      toast({
        title: 'Login Successful',
        description: 'You have successfully logged in.',
      });
      return { data, error: null };
    } catch (error: any) {
      handleError(error, 'AuthProvider.login');
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      
      logDebug('Login with Google initiated', null, 'info');
    } catch (error: any) {
      handleError(error, 'AuthProvider.loginWithGoogle');
      toast({
        title: 'Login with Google Failed',
        description: error.message || 'Could not initiate Google login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithDiscord = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      
      logDebug('Login with Discord initiated', null, 'info');
    } catch (error: any) {
      handleError(error, 'AuthProvider.loginWithDiscord');
      toast({
        title: 'Login with Discord Failed',
        description: error.message || 'Could not initiate Discord login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            role: 'guest'
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      
      logDebug(`User registered with email ${email}`, { userId: data.user?.id }, 'info');
      toast({
        title: 'Registration Successful',
        description: 'Please check your email to verify your account.',
      });
      return { data, error: null };
    } catch (error: any) {
      handleError(error, 'AuthProvider.register');
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not register. Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      logDebug('User logged out', null, 'info');
      toast({
        title: 'Logout Successful',
        description: 'You have been successfully logged out.',
      });
      navigate('/login');
    } catch (error: any) {
      handleError(error, 'AuthProvider.logout');
      toast({
        title: 'Logout Failed',
        description: error.message || 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      
      logDebug(`Password reset initiated for email ${email}`, null, 'info');
      toast({
        title: 'Password Reset Initiated',
        description: 'Please check your email for further instructions.',
      });
      return { data, error: null };
    } catch (error: any) {
      handleError(error, 'AuthProvider.resetPassword');
      toast({
        title: 'Password Reset Failed',
        description: error.message || 'Could not initiate password reset. Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      logDebug('Password updated successfully', null, 'info');
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
      return { data, error: null };
    } catch (error: any) {
      handleError(error, 'AuthProvider.updatePassword');
      toast({
        title: 'Password Update Failed',
        description: error.message || 'Could not update password. Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (profile: UserProfileUpdate) => {
    setIsLoading(true);
    try {
      if (!session?.user) throw new Error('No user session found');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      logDebug(`User profile updated`, { userId: session.user.id, updatedFields: profile }, 'info');
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      
      // Refresh the user profile after updating
      await loadUserProfile(session.user.id);
    } catch (error: any) {
      handleError(error, 'AuthProvider.updateProfile');
      toast({
        title: 'Profile Update Failed',
        description: error.message || 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasRole = (role: UserRoleType): boolean => {
    return userProfile?.role === role;
  };
  
  // Add this function to the component
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!session?.user) return null;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      
      if (profile) {
        logDebug(`User profile refreshed`, { id: profile.id, role: profile.role }, 'info');
        setUserProfile(profile);
        return profile;
      }
      
      return null;
    } catch (error) {
      handleError(error, 'refreshUserProfile');
      return null;
    }
  };
  
  // Find the return statement with the context value and add refreshUserProfile
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        isLoading,
        user: session?.user || null,
        userProfile,
        login,
        loginWithGoogle,
        loginWithDiscord,
        register,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
        hasRole,
        refreshUserProfile, // Add this line
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
