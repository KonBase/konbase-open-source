import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isConfigured } from '@/lib/config-store'; // Import isConfigured

interface SetupEnforcerProps {
  children: React.ReactNode;
}

const SetupEnforcer: React.FC<SetupEnforcerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const configured = isConfigured(); // Use isConfigured

  useEffect(() => {
    // If not configured and not already on a setup page, redirect to setup
    if (!configured && !location.pathname.startsWith('/setup')) {
      console.log('SetupEnforcer: Not configured, redirecting to /setup');
      navigate('/setup', { replace: true });
    }
    // If configured and on a setup page, redirect to dashboard (or home)
    else if (configured && location.pathname.startsWith('/setup')) {
      console.log('SetupEnforcer: Configured, redirecting from setup page to /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [configured, navigate, location.pathname]);

  // Render children only if the configuration state allows the current route
  if (!configured && !location.pathname.startsWith('/setup')) {
    // Render nothing or a loading indicator while redirecting
    return null;
  }
  if (configured && location.pathname.startsWith('/setup')) {
     // Render nothing or a loading indicator while redirecting
    return null;
  }

  return <>{children}</>;
};

export default SetupEnforcer;
