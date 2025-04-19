import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { getLastVisitedPath } from '@/utils/session-utils';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Use 'user' instead of 'isAuthenticated'

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // If authenticated (user exists), try to redirect to last visited path 
    if (!!user) {
      const lastPath = getLastVisitedPath();
      if (lastPath && lastPath !== location.pathname && lastPath !== '/404') {
        console.log("Redirecting to last visited path:", lastPath);
        setTimeout(() => {
          navigate(lastPath, { replace: true });
        }, 100);
      }
    }
  }, [location.pathname, user, navigate]); // Update dependency array

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
        <p className="mb-6 text-muted-foreground">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
          {!!user ? ( // Check if user exists
            <Button variant="outline" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
