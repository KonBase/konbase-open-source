import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRoleType } from '@/types/user'; // Assuming UserRoleType is defined here
import { checkUserHasRole } from '@/contexts/auth/AuthUtils'; // Import the utility function
import { logDebug } from '@/utils/debug'; // Assuming logDebug is here
import { Spinner } from '../ui/spinner'; // Correct named import

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRoleType[]; // Roles required to access the route
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRoles }) => {
  const { user, userProfile, loading } = useAuth(); // Removed isAuthenticated
  const location = useLocation();
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean | null>(null); // null initially

  useEffect(() => {
    if (loading) {
      setHasRequiredRole(null); // Still loading, don't make a decision yet
      return;
    }

    // Check if user exists instead of isAuthenticated
    if (!user) {
      setHasRequiredRole(false); // Not authenticated, definitely no access
      return;
    }

    // If no specific roles are required, authentication is enough
    if (!requiredRoles || requiredRoles.length === 0) {
      setHasRequiredRole(true);
      return;
    }

    // Check roles only if authenticated and roles are required
    const checkRoleAccess = () => {
      // Ensure userProfile is loaded before checking roles
      if (!userProfile) {
         logDebug('AuthGuard: User profile not yet loaded for role check.', {}, 'info');
         setHasRequiredRole(null); // Wait for profile
         return;
      }

      // Use checkUserHasRole utility function with userProfile
      const hasAccess = requiredRoles.some(role => checkUserHasRole(userProfile, role));
      setHasRequiredRole(hasAccess);

      if (!hasAccess) {
        logDebug('Access denied - insufficient role', {
          userRole: userProfile.role, // Assuming role is on userProfile
          requiredRoles
        }, 'warn');
      } else {
         logDebug('Access granted - sufficient role', {
           userRole: userProfile.role,
           requiredRoles
         }, 'info');
      }
    };
    checkRoleAccess();

  }, [loading, user, userProfile, requiredRoles]); // Use user instead of isAuthenticated

  if (loading || hasRequiredRole === null) {
    // Show loading indicator while checking auth status or waiting for profile
    // Show loading indicator while checking auth status or waiting for profile
    return <Spinner loadingText="Checking access..." />; // Changed LoadingSpinner to Spinner and passed message as loadingText
  }

  // Check if user exists instead of isAuthenticated
  if (!user) {
    // Redirect to login page if not authenticated
    logDebug('Redirecting to login - not authenticated', { from: location.pathname }, 'info');
    return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRequiredRole) {
    // Redirect to an unauthorized page or dashboard if roles don't match
    logDebug('Redirecting to unauthorized/dashboard - insufficient role', { from: location.pathname }, 'warn');
    // You might want a specific '/unauthorized' page
    return <Navigate to="/dashboard" state={{ unauthorized: true, from: location }} replace />;
  }

  // If authenticated and has required role (or no specific role required), render the children
  return <>{children}</>;
};

export default AuthGuard;
