
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const DashboardRedirectHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle redirect from setupWizard if there's a 'completed' query param
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('completed') === 'true') {
      toast({
        title: "Setup completed",
        description: "Welcome to your dashboard!"
      });
      // Clear the query parameter
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);
  
  return null; // This component doesn't render anything
};

export default DashboardRedirectHandler;
