
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { navItems } from './navigation/navItems';
import ExpandableMenuItem from './navigation/ExpandableMenuItem';
import MenuItem from './navigation/MenuItem';

interface SidebarNavProps {
  collapsed: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex flex-col h-full">
      <nav className={`px-2 space-y-1 flex-grow ${collapsed ? 'text-center' : ''}`}>
        {navItems.map(item => {
          // Skip items the user doesn't have permission for
          if (item.requiredRole && !hasPermission(item.requiredRole)) {
            return null;
          }

          const isItemActive = isActive(item.path);
          const isExpanded = expandedItems[item.title] || isItemActive;

          // Handle items with submenus
          if (item.submenu) {
            return (
              <ExpandableMenuItem
                key={item.title}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
                isExpanded={isExpanded}
                toggleExpand={() => toggleExpand(item.title)}
              />
            );
          }
          
          // Handle regular menu items
          return (
            <MenuItem
              key={item.title}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
            />
          );
        })}
      </nav>
    </div>
  );
};

export default SidebarNav;
