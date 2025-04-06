
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContextType, AuthState, AuthUser, AuthUserProfile } from './AuthTypes';
import { checkUserHasPermission, checkUserHasRole, elevateUserToSuperAdmin, fetchAndEnhanceUserProfile } from './AuthUtils';
import { USER_ROLES, UserRoleType } from '@/types/user';

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the auth context
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    userProfile: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Update state helper function
  const updateState = (newState: Partial<AuthState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  // Fetch user profile when user changes
  useEffect(() => {
    if (state.user?.id) {
      fetchAndEnhanceUserProfile(
        state.user.id,
        state.user,
        (profile) => updateState({ userProfile: profile }),
        (user) => updateState({ user })
      );
    }
  }, [state.user?.id]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        updateState({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          loading: false,
          isLoading: false
        });
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateState({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        loading: false,
        isLoading: false
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
    } catch (error: any) {
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
    } catch (error: any) {
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  };

  const signOut = async () => {
    try {
      updateState({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      updateState({
        user: null,
        userProfile: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error: any) {
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  };

  // Role and permission checks
  const hasRole = (requiredRole: UserRoleType) => {
    return checkUserHasRole(state.userProfile, requiredRole);
  };

  const hasPermission = (permission: string) => {
    return checkUserHasPermission(state.userProfile, permission);
  };

  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    try {
      updateState({ loading: true });
      const userRoleValue = state.userProfile?.role ? USER_ROLES[state.userProfile.role]?.level || 0 : 0;
      const requiredRoleValue = USER_ROLES[role]?.level || 0;
      
      return userRoleValue >= requiredRoleValue;
    } catch (error) {
      console.error('Error checking role access:', error);
      return false;
    } finally {
      updateState({ loading: false });
    }
  };

  // Legacy method aliases
  const login = signIn;
  const logout = signOut;

  // Super admin elevation
  const elevateToSuperAdmin = async () => {
    return await elevateUserToSuperAdmin(
      state.userProfile,
      state.user,
      (user) => updateState({ user }),
      (profile) => updateState({ userProfile: profile })
    );
  };

  // Prepare the context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasPermission,
    checkRoleAccess,
    login, // Legacy
    logout, // Legacy
    elevateToSuperAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
