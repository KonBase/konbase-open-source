
import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarHeaderProps {
  collapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed }) => {
  return (
    <div className="p-4 border-b border-border">
      <Link to="/" className="flex items-center">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
          EN
        </div>
        {!collapsed && (
          <div className="ml-3">
            <h3 className="font-semibold">EventNexus</h3>
            <p className="text-xs text-muted-foreground">Convention Manager</p>
          </div>
        )}
      </Link>
    </div>
  );
};

export default SidebarHeader;
