
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/user';

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
  hasPermission: (role: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  userProfile: any | null;
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
          role: profileData.role || 'guest',
          email: user.email || profileData.email
        };
        
        setUser(enhancedUser);
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const hasPermission = (requiredRole: string) => {
    if (!userProfile) return false;
    
    const roleHierarchy: Record<string, number> = {
      'super_admin': 100,
      'admin': 80,
      'manager': 60,
      'member': 40,
      'guest': 20
    };
    
    const userRoleValue = roleHierarchy[userProfile.role as string] || 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;
    
    return userRoleValue >= requiredRoleValue;
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
      login,
      logout,
      userProfile
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
