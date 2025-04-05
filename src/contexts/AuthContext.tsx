
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { User, UserRoleType, USER_ROLES } from '@/types/user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (requiredRole: UserRoleType) => boolean;
  checkRoleAccess: (role: UserRoleType) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  userProfile: any | null;
  elevateToSuperAdmin: () => Promise<{success: boolean, message: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isAuthenticated = !!session;
  const isLoading = loading;

  useEffect(() => {
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          const userData = session.user as unknown as User;
          setUser(userData);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        
        setError(error?.message || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        
        if (session?.user) {
          const userData = session.user as unknown as User;
          setUser(userData);
          
          // Use setTimeout to prevent auth deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      // Use maybeSingle instead of single to handle the case where no profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (user) {
        // Create a default profile if none exists
        const profileData = data || {
          id: userId,
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'guest',
          profile_image: null
        };
        
        const enhancedUser = {
          ...user,
          name: profileData.name || profileData.email?.split('@')[0] || 'User',
          profileImage: profileData.profile_image,
          role: profileData.role as UserRoleType || 'guest',
          email: user.email || profileData.email
        };
        
        setUser(enhancedUser);
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const hasRole = (requiredRole: UserRoleType): boolean => {
    if (!userProfile || !userProfile.role) return false;
    
    const userRoleValue = USER_ROLES[userProfile.role as UserRoleType]?.level || 0;
    const requiredRoleValue = USER_ROLES[requiredRole]?.level || 0;
    
    return userRoleValue >= requiredRoleValue;
  };

  const hasPermission = (requiredPermission: string): boolean => {
    if (!userProfile || !userProfile.role) return false;
    
    const rolePermissions = USER_ROLES[userProfile.role as UserRoleType]?.permissions || [];
    
    // Check if the user has the specific permission or admin:all
    return rolePermissions.includes(requiredPermission) || rolePermissions.includes('admin:all');
  };

  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    // If not even authenticated, no access
    if (!isAuthenticated || !userProfile) {
      return false;
    }
    
    // If current role doesn't have necessary level, no access
    if (!hasRole(role)) {
      return false;
    }
    
    // If role requires 2FA but user doesn't have it enabled, no access
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

  // Function to elevate to super_admin after verifying 2FA
  const elevateToSuperAdmin = async (): Promise<{success: boolean, message: string}> => {
    if (!isAuthenticated || !userProfile) {
      return { 
        success: false, 
        message: "You must be logged in to access Super Admin privileges" 
      };
    }
    
    // Check if user's role in database is actually super_admin
    if (userProfile.role !== 'super_admin') {
      return { 
        success: false, 
        message: "You don't have Super Admin privileges" 
      };
    }
    
    // Check if 2FA is enabled
    if (!userProfile.two_factor_enabled) {
      return { 
        success: false, 
        message: "Two-Factor Authentication must be enabled to access Super Admin privileges" 
      };
    }
    
    try {
      // Force a new login with 2FA verification to elevate privileges
      // This is handled through a challenge/verify flow when accessing admin areas
      
      // Create a record of this elevation attempt for audit purposes
      await supabase.from('audit_logs').insert({
        action: 'super_admin_elevation',
        entity: 'users',
        entity_id: userProfile.id,
        user_id: userProfile.id,
        changes: { role: 'super_admin' }
      });
      
      return { 
        success: true, 
        message: "Super Admin privileges activated" 
      };
    } catch (error: any) {
      console.error('Error during super admin elevation:', error);
      return { 
        success: false, 
        message: error.message || "Failed to activate Super Admin privileges"
      };
    }
  };

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
        // Reset user state and session
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
  
  const login = signIn;
  const logout = signOut;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      error,
      isAuthenticated,
      isLoading,
      hasPermission,
      hasRole,
      checkRoleAccess,
      login,
      logout,
      userProfile,
      elevateToSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
