
// Re-export all type definitions for easy imports
export * from './user';

// Add any other global types here
export type Permission = 
  | 'manage:users'
  | 'manage:inventory'
  | 'manage:associations'
  | 'manage:conventions'
  | 'manage:reports'
  | 'view:dashboard'
  | 'admin:all';

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}
