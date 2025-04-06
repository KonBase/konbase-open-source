
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { AuthContextType } from './AuthTypes';

/**
 * Custom hook to access the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
