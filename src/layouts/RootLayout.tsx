
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/components/ui/use-toast';
import useNetworkStatus from '@/hooks/useNetworkStatus';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { status, isOffline } = useNetworkStatus({
    showToasts: false,
    testInterval: 60000 // Check connection every minute
  });

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

  // Add effect to redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
