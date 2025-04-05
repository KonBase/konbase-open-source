
import React from 'react';
import { Link } from 'react-router-dom';
import { useAssociation } from '@/contexts/AssociationContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building } from 'lucide-react';

interface SidebarAssociationInfoProps {
  collapsed: boolean;
}

const SidebarAssociationInfo: React.FC<SidebarAssociationInfoProps> = ({ collapsed }) => {
  const { currentAssociation, isLoading } = useAssociation();
  
  if (isLoading) {
    return (
      <div className="py-3 px-3 border-b border-border">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }
  
  if (!currentAssociation) {
    return (
      <div className={`py-3 px-3 border-b border-border ${collapsed ? 'text-center' : ''}`}>
        <Button 
          variant="outline" 
          size={collapsed ? "icon" : "sm"} 
          className="w-full"
          asChild
        >
          <Link to="/setup">
            <Building className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Set Up Association</span>}
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <Link to="/dashboard" className="block border-b border-border hover:bg-accent/30 transition-colors">
      <div className={`py-3 px-3 flex ${collapsed ? 'justify-center' : 'items-center'}`}>
        {currentAssociation.logo ? (
          <div className={`bg-primary/10 rounded-md flex items-center justify-center ${collapsed ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <img 
              src={currentAssociation.logo} 
              alt={currentAssociation.name} 
              className="h-6 w-6 object-contain" 
            />
          </div>
        ) : (
          <div className={`bg-primary/10 rounded-md flex items-center justify-center ${collapsed ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <Building className="h-5 w-5 text-primary" />
          </div>
        )}
        
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="font-medium text-sm truncate">{currentAssociation.name}</p>
            {currentAssociation.type && (
              <p className="text-xs text-muted-foreground truncate">{currentAssociation.type}</p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default SidebarAssociationInfo;
