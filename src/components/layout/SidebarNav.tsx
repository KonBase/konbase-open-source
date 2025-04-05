
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
  ShieldAlert,
  Home
} from 'lucide-react';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  submenu?: SidebarItem[];
  requiredRole?: 'member' | 'manager' | 'admin' | 'super_admin';
}

interface SidebarNavProps {
  collapsed: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
        { title: 'List', path: '/association/list', icon: <FileText className="w-4 h-4" /> },
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
        { title: 'Warranties', path: '/inventory/warranties', icon: <FileText className="w-4 h-4" /> },
        { title: 'Import/Export', path: '/inventory/import-export', icon: <FileText className="w-4 h-4" /> },
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
        { title: 'Logs', path: '/conventions/logs', icon: <FileText className="w-4 h-4" /> },
        { title: 'Archive', path: '/conventions/archive', icon: <FileBox className="w-4 h-4" /> },
      ],
      requiredRole: 'member'
    },
    {
      title: 'Templates',
      path: '/templates',
      icon: <FileBox className="w-5 h-5" />,
      requiredRole: 'member'
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      requiredRole: 'manager'
    },
    {
      title: 'Chat',
      path: '/chat',
      icon: <MessageCircle className="w-5 h-5" />,
      requiredRole: 'member'
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
    <div className="flex flex-col h-full">
      <nav className={`px-2 space-y-1 flex-grow ${collapsed ? 'text-center' : ''}`}>
        {navItems.map(item => {
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
  );
};

export default SidebarNav;

import { MessageCircle } from 'lucide-react';
