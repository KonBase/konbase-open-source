
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAssociation } from '@/contexts/AssociationContext';

interface SidebarAssociationInfoProps {
  collapsed: boolean;
}

const SidebarAssociationInfo: React.FC<SidebarAssociationInfoProps> = ({ collapsed }) => {
  const { currentAssociation } = useAssociation();
  
  if (!currentAssociation) return null;

  return (
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
  );
};

export default SidebarAssociationInfo;
