
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/components/ui/use-toast';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { handleOAuthRedirect } from '@/utils/oauth-redirect-handler';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { status, isOffline } = useNetworkStatus({
    showToasts: false,
    testInterval: 60000, // Check connection every minute
    testEndpoint: 'https://www.google.com' // Use a reliable public endpoint
  });

  // Process OAuth redirects when the component mounts
  useEffect(() => {
    const processOAuthRedirect = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        const result = await handleOAuthRedirect();
        if (result.success) {
          toast({
            title: "Login successful",
            description: "You have been successfully logged in.",
          });
          // Redirect to the dashboard
          navigate('/dashboard', { replace: true });
        }
      }
    };

    processOAuthRedirect();
  }, [location.hash, navigate, toast]);

  // Add effect to show offline status
  useEffect(() => {
    if (isOffline) {
      toast({
        title: "You're offline",
        description: "Some features may not work correctly. Please check your connection.",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [isOffline, toast]);

  // Check if we're on a public page that doesn't require authentication
  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  // Only redirect unauthenticated users if they're not on a public page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, isPublicPage]);

  // If loading, show minimal layout
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if we're on the index page
  const isIndexPage = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      {isAuthenticated && !isIndexPage && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
