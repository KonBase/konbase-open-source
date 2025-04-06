
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRoleType } from '@/types/user';

// Extended Auth Context state
export interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Extended User type with additional properties
export interface AuthUser extends SupabaseUser {
  name?: string;
  profileImage?: string;
  role?: UserRoleType;
  email?: string;
}

// User profile from the database
export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  association_id?: string;
  profile_image?: string;
  two_factor_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Auth Context methods
export interface AuthContextMethods {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (requiredRole: UserRoleType) => boolean;
  checkRoleAccess: (role: UserRoleType) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  elevateToSuperAdmin: () => Promise<{success: boolean, message: string}>;
}

// Complete Auth Context type
export type AuthContextType = AuthState & AuthContextMethods;
