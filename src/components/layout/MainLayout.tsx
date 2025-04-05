
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is profile or settings, which don't need header
  const isHeaderDisabledPage = location.pathname.startsWith('/profile') || 
                               location.pathname.startsWith('/settings');
  
  useEffect(() => {
    // Check if user is authenticated and redirect if needed
    if (!isLoading && !isAuthenticated && !location.pathname.startsWith('/login')) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For profile and settings pages, just render the Outlet without header
  if (isHeaderDisabledPage) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      {isAuthenticated && <Header />}
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
