
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { Header } from './Header';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
