
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export default AuthGuard;
