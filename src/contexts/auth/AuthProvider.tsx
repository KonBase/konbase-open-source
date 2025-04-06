
import { createContext, useEffect, useState, ReactNode } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType, AuthUser, AuthUserProfile } from './AuthTypes';
import { UserRoleType } from '@/types/user';
import { 
  checkUserHasRole, 
  checkUserHasPermission, 
  fetchAndEnhanceUserProfile,
  elevateUserToSuperAdmin 
} from './AuthUtils';

// Create context with undefined default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Derived state
  const isAuthenticated = !!session;
  const isLoading = loading;

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setLoading(true);

        // First, set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log('Auth state changed:', event);
            setSession(newSession);
            
            if (newSession?.user) {
              const userData = newSession.user as unknown as AuthUser;
              setUser(userData);
              
              // Use setTimeout to avoid potential recursive updates
              setTimeout(() => {
                fetchAndEnhanceUserProfile(newSession.user.id, userData, setUserProfile, setUser);
              }, 0);
            } else {
              setUser(null);
              setUserProfile(null);
            }
          }
        );

        // Then check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('Existing session found');
          setSession(existingSession);
          
          if (existingSession.user) {
            const userData = existingSession.user as unknown as AuthUser;
            setUser(userData);
            await fetchAndEnhanceUserProfile(existingSession.user.id, userData, setUserProfile, setUser);
          }
        } else {
          console.log('No existing session found');
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  // Role and permission checks
  const hasRole = (requiredRole: UserRoleType): boolean => {
    return checkUserHasRole(userProfile, requiredRole);
  };

  const hasPermission = (requiredPermission: string): boolean => {
    return checkUserHasPermission(userProfile, requiredPermission);
  };

  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    if (!isAuthenticated || !userProfile) {
      console.log('checkRoleAccess failed: Not authenticated or no profile');
      return false;
    }
    
    if (!hasRole(role)) {
      console.log(`checkRoleAccess failed: User does not have role ${role}`);
      return false;
    }
    
    if (USER_ROLES[role].requires2FA && !userProfile.two_factor_enabled) {
      toast({
        title: "Two-Factor Authentication Required",
        description: `The ${USER_ROLES[role].name} role requires 2FA to be enabled.`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
      } else {
        toast({
          title: "Registration successful",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account."
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Alias methods for consistency
  const login = signIn;
  const logout = signOut;
  
  // Super admin elevation
  const elevateToSuperAdmin = async () => {
    return elevateUserToSuperAdmin(userProfile, user, setUser, setUserProfile);
  };

  // Construct the full context value
  const contextValue: AuthContextType = {
    session,
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    hasRole,
    checkRoleAccess,
    login,
    logout,
    elevateToSuperAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
