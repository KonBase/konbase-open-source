
// Re-export all type definitions for easy imports
export * from './user';
export * from './association';

// Add any other global types here
export type Permission = 
  | 'admin:all'
  | 'manage:users'
  | 'manage:inventory'
  | 'manage:associations'
  | 'manage:conventions'
  | 'manage:reports'
  | 'manage:system'
  | 'manage:billing'
  | 'view:dashboard'
  | 'view:inventory'
  | 'view:conventions'
  | 'view:reports'
  | 'view:public'
  | 'participate:events'
  | 'elevate:super_admin';

// Import the user role types from user.ts
import { UserRoleType } from './user';

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  roleType: UserRoleType;
}

// OAuth redirect handling types
export interface OAuthParams {
  access_token?: string;
  expires_at?: string;
  expires_in?: string;
  provider_token?: string;
  refresh_token?: string;
  token_type?: string;
}
