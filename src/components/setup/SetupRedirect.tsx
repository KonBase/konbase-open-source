import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SetupRedirect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isConfigured = isSupabaseConfigured();
  
  useEffect(() => {
    // Check if application is configured
    if (!isConfigured && window.location.pathname !== '/setup') {
      // Don't redirect from auth pages
      const isAuthPage = 
        window.location.pathname === '/login' || 
        window.location.pathname === '/register' || 
        window.location.pathname.includes('/reset-password') || 
        window.location.pathname.includes('/forgot-password');
        
      if (!isAuthPage) {
        toast({
          title: "Setup required",
          description: "Please configure your Supabase connection to continue.",
        });
        
        navigate('/setup');
      }
    }
  }, [isConfigured, navigate, toast]);
  
  // This component doesn't render anything
  return null;
}
