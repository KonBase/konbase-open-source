
// This file now re-exports from the refactored auth context for backward compatibility
import { AuthContext, AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';

export { AuthContext, AuthProvider, useAuth };
