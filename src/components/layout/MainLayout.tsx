import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import DashboardFooter from './DashboardFooter';

const MainLayout: React.FC = () => {
  const { user, loading: isLoading } = useAuth(); // Use 'user' and rename 'loading' if needed
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is profile or settings, which don't need header
  const isHeaderDisabledPage = location.pathname.startsWith('/profile') || 
                               location.pathname.startsWith('/settings');
  
  // Check if current path is public and doesn't require authentication
  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    // Check if user is authenticated and redirect if needed
    if (!isLoading && !user && !isPublicPage) { // Check for 'user' existence instead of 'isAuthenticated'
      navigate('/login');
    }
  }, [user, isLoading, navigate, location.pathname, isPublicPage]); // Update dependency array

  // Add meta viewport tag dynamically to ensure proper mobile display
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!isHeaderDisabledPage && <Header />}
      <main className="flex-1">
        <div className="container px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
};

export default MainLayout;
