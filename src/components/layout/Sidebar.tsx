
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Home,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  submenu?: SidebarItem[];
  requiredRole?: 'member' | 'manager' | 'admin' | 'super_admin';
}

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapse }) => {
  const { user, hasPermission, logout } = useAuth();
  const { currentAssociation } = useAssociation();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      <div className={`p-4 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
          EN
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="font-semibold truncate">EventNexus</h2>
            <p className="text-xs text-muted-foreground truncate">Supply Chain Management</p>
          </div>
        )}
      </div>
      
      {/* Association info */}
      {currentAssociation && (
        <div className={`p-4 border-b border-border ${collapsed ? 'items-center justify-center' : ''} flex flex-col`}>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 flex-shrink-0">
            {currentAssociation.logo ? (
              <img src={currentAssociation.logo} alt={currentAssociation.name} className="w-12 h-12 rounded-full" />
            ) : (
              <Avatar className="h-12 w-12">
                <AvatarFallback>{currentAssociation.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>
          {!collapsed && (
            <div className="text-center">
              <h3 className="font-medium truncate">{currentAssociation.name}</h3>
              {currentAssociation.contactEmail && (
                <p className="text-xs text-muted-foreground truncate">{currentAssociation.contactEmail}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className={`px-2 space-y-1 ${collapsed ? 'text-center' : ''}`}>
          {navItems.map(item => {
            // Check permissions
            if (item.requiredRole && !hasPermission(item.requiredRole)) {
              return null;
            }

            const isItemActive = isActive(item.path);
            const isExpanded = expandedItems[item.title] || isItemActive;

            if (item.submenu && !collapsed) {
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md",
                      isItemActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
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
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-accent/50"
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
            } else if (item.submenu && collapsed) {
              // Show just the main item icon when collapsed
              return (
                <div key={item.title} className="my-2 flex justify-center">
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md",
                      isItemActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                    title={item.title}
                  >
                    {item.icon}
                  </Link>
                </div>
              );
            } else {
              // Regular menu item
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    collapsed 
                      ? "flex items-center justify-center p-2 my-2 rounded-md"
                      : "flex items-center px-3 py-2 text-sm rounded-md",
                    isItemActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              );
            }
          })}
        </nav>
      </div>
      
      {/* User profile (mini) */}
      {!collapsed && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      
      <Separator className="my-2" />
      
      {/* Logout button */}
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
    </aside>
  );
};

export default Sidebar;
