
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface GuestGuardProps {
  children: React.ReactNode;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { user, loading: isLoading } = useAuth(); // Use 'user' and rename 'loading' to 'isLoading' for consistency if needed, or just use 'loading'
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  // Check if the user object exists to determine authentication
  if (!!user) { 
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default GuestGuard;
