
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Package, 
  Users, 
  FileBox, 
  MapPin, 
  Calendar, 
  FileText, 
  Settings, 
  ChevronDown,
  LogOut,
  ShieldAlert,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  submenu?: SidebarItem[];
  requiredRole?: 'member' | 'manager' | 'admin' | 'super_admin';
}

const Sidebar: React.FC = () => {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const navItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      requiredRole: 'member'
    },
    {
      title: 'Association',
      path: '/association',
      icon: <Building2 className="w-5 h-5" />,
      submenu: [
        { title: 'Profile', path: '/association/profile', icon: <Home className="w-4 h-4" /> },
        { title: 'Members', path: '/association/members', icon: <Users className="w-4 h-4" /> },
      ],
      requiredRole: 'member'
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: <Package className="w-5 h-5" />,
      submenu: [
        { title: 'Items', path: '/inventory/items', icon: <Package className="w-4 h-4" /> },
        { title: 'Categories', path: '/inventory/categories', icon: <FileBox className="w-4 h-4" /> },
        { title: 'Locations', path: '/inventory/locations', icon: <MapPin className="w-4 h-4" /> },
        { title: 'Equipment Sets', path: '/inventory/sets', icon: <FileBox className="w-4 h-4" /> },
      ],
      requiredRole: 'member'
    },
    {
      title: 'Conventions',
      path: '/conventions',
      icon: <Calendar className="w-5 h-5" />,
      submenu: [
        { title: 'All Conventions', path: '/conventions', icon: <Calendar className="w-4 h-4" /> },
        { title: 'Requirements', path: '/conventions/requirements', icon: <FileText className="w-4 h-4" /> },
      ],
      requiredRole: 'member'
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      requiredRole: 'manager'
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      requiredRole: 'manager'
    },
    {
      title: 'Admin',
      path: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      submenu: [
        { title: 'Users', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { title: 'Audit Logs', path: '/admin/logs', icon: <FileText className="w-4 h-4" /> },
        { title: 'Backups', path: '/admin/backups', icon: <FileBox className="w-4 h-4" /> },
      ],
      requiredRole: 'admin'
    }
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="h-screen w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
          EN
        </div>
        <div>
          <h2 className="font-semibold text-sidebar-foreground">EventNexus</h2>
          <p className="text-xs text-sidebar-foreground/70">Supply Chain Management</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-1">
          {navItems.map(item => {
            // Check permissions
            if (item.requiredRole && !hasPermission(item.requiredRole)) {
              return null;
            }

            const isItemActive = isActive(item.path);
            const isExpanded = expandedItems[item.title] || isItemActive;

            if (item.submenu) {
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md",
                      isItemActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn("w-4 h-4 transition-transform", isExpanded ? "transform rotate-180" : "")}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-4 space-y-1">
                      {item.submenu.map(subItem => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-md",
                            isActive(subItem.path)
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          {subItem.icon}
                          <span className="ml-3">{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  isItemActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="font-medium text-sidebar-foreground">
                  {user.name && user.name.length > 0 ? user.name.charAt(0) : '?'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{user.name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/70">{user.role || 'Guest'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent/50" 
            onClick={() => logout()}
          >
            <LogOut className="mr-2 w-4 h-4" />
            Logout
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
