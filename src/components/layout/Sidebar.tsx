
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SidebarHeader from './SidebarHeader';
import SidebarAssociationInfo from './SidebarAssociationInfo';
import SidebarUserProfile from './SidebarUserProfile';
import LogoutButton from './LogoutButton';

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapse }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <aside className="h-screen flex flex-col bg-background border-r border-border relative">
      {/* Toggle collapse button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full shadow-md border border-border"
        onClick={toggleCollapse}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
      
      {/* Application header */}
      <SidebarHeader collapsed={collapsed} />
      
      {/* Association info */}
      <SidebarAssociationInfo collapsed={collapsed} />
      
      {/* Spacer to push content to bottom */}
      <div className="flex-1" />
      
      {/* User profile (mini) */}
      <SidebarUserProfile collapsed={collapsed} />
      
      <Separator className="my-2" />
      
      {/* Logout button */}
      <LogoutButton collapsed={collapsed} />
    </aside>
  );
};

export default Sidebar;
