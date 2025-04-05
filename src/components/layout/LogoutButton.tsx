
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  collapsed: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ collapsed }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`p-4 ${collapsed ? 'flex justify-center' : ''}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "justify-start border-border hover:bg-accent/50",
          collapsed && "w-10 h-10 p-0 flex items-center justify-center"
        )}
        onClick={handleLogout}
        title={collapsed ? "Logout" : undefined}
      >
        <LogOut className={collapsed ? "w-4 h-4" : "mr-2 w-4 h-4"} />
        {!collapsed && "Logout"}
      </Button>
    </div>
  );
};

export default LogoutButton;
