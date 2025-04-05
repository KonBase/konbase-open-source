
import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarHeaderProps {
  collapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed }) => {
  return (
    <div className="flex items-center p-4">
      <Link to="/" className="flex items-center space-x-2">
        <img 
          src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
          alt="Logo" 
          className="h-8 w-8" 
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-xl">EventNexus</span>
            <span className="text-xs text-muted-foreground">Supply Chain Management</span>
          </div>
        )}
      </Link>
    </div>
  );
};

export default SidebarHeader;
