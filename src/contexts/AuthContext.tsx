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
        const savedSession = localStorage.getItem('supabase.auth.token');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed.currentSession && parsed.expiresAt > Math.floor(Date.now() / 1000)) {
              setSession(parsed.currentSession);
              
              if (parsed.currentSession.user) {
                const userData = parsed.currentSession.user as unknown as User;
                setUser(userData);
                await fetchUserProfile(parsed.currentSession.user.id);
              }
            }
          } catch (e) {
            console.error('Error parsing saved session:', e);
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          
          if (session.user) {
            const userData = session.user as unknown as User;
            setUser(userData);
            await fetchUserProfile(session.user.id);
          }
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
      async (_event, session) => {
        setSession(session);
        
        if (session?.user) {
          const userData = session.user as unknown as User;
          setUser(userData);
          
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
          
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: session,
            expiresAt: Math.floor(Date.now() / 1000) + (session.expires_in || 3600)
          }));
          
          localStorage.setItem('supabase.auth.access_token', session.access_token);
        } else {
          setUser(null);
          setUserProfile(null);
          
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.access_token');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (user) {
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
    
    return rolePermissions.includes(requiredPermission) || rolePermissions.includes('admin:all');
  };

  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    if (!isAuthenticated || !userProfile) {
      return false;
    }
    
    if (!hasRole(role)) {
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

  const elevateToSuperAdmin = async (): Promise<{success: boolean, message: string}> => {
    if (!isAuthenticated || !userProfile) {
      return { 
        success: false, 
        message: "You must be logged in to access Super Admin privileges" 
      };
    }
    
    if (userProfile.role !== 'system_admin' && userProfile.role !== 'super_admin') {
      return { 
        success: false, 
        message: "You don't have sufficient privileges for this action" 
      };
    }
    
    if (!userProfile.two_factor_enabled) {
      return { 
        success: false, 
        message: "Two-Factor Authentication must be enabled to access Super Admin privileges" 
      };
    }
    
    try {
      if (userProfile.role === 'system_admin') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', userProfile.id);
          
        if (error) throw error;
        
        if (user) {
          const updatedUser = { ...user, role: 'super_admin' as UserRoleType };
          setUser(updatedUser);
        }
        
        setUserProfile({ ...userProfile, role: 'super_admin' });
      }
      
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
