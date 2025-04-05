
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { Header } from './Header';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Check if current path is profile or settings, which don't need sidebar
  const isSidebarDisabledPage = location.pathname.startsWith('/profile') || 
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

  // For profile and settings pages, just render the Outlet without sidebar
  if (isSidebarDisabledPage) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isAuthenticated && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-200 ease-in-out`}>
          <Sidebar collapsed={!sidebarOpen} toggleCollapse={toggleSidebar} />
        </div>
      )}
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {isAuthenticated && <Header />}
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
