
import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User, UserRole } from "../types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Map Supabase user to our User type
  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || "User",
      role: supabaseUser.user_metadata?.role || "member",
      associationId: supabaseUser.user_metadata?.associationId,
      twoFactorEnabled: supabaseUser.user_metadata?.twoFactorEnabled || false,
      createdAt: supabaseUser.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth:", error);
          return;
        }
        
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          setUser(mappedUser);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          setUser(mappedUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    checkAuth();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
      }
    } catch (error: any) {
      console.error("Login error:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "member"
          }
        }
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        
        // Note: This is where you would normally add the user to your database
        // For now, we're just using the Supabase Auth user
      }
    } catch (error: any) {
      console.error("Registration error:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("No user logged in");
      
      const { error } = await supabase.auth.updateUser({
        data: {
          ...userData,
          updatedAt: new Date().toISOString(),
        }
      });
      
      if (error) {
        throw error;
      }
      
      setUser(prev => prev ? { ...prev, ...userData, updatedAt: new Date().toISOString() } : null);
    } catch (error: any) {
      console.error("Update user error:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: UserRole[] = [
      "guest",
      "member",
      "manager",
      "admin",
      "super_admin"
    ];
    
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateUser,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
