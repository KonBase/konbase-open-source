
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarHeaderProps {
  collapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed }) => {
  return (
    <div className={`p-4 border-b border-border ${collapsed ? 'justify-center' : 'gap-2'} flex items-center`}>
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
  );
};

export default SidebarHeader;
