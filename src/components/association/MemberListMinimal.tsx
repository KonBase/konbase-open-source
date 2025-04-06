
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UsersIcon } from 'lucide-react';
import { AssociationMember } from '@/hooks/useAssociationMembers';

interface MemberListMinimalProps {
  members: AssociationMember[];
}

const MemberListMinimal: React.FC<MemberListMinimalProps> = ({ members }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-6">
        <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.slice(0, 5).map(member => (
        <div key={member.id} className="flex justify-between items-center py-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={member.profileImage || ''} alt={member.name} />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{member.name}</span>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded-full">{member.role}</span>
        </div>
      ))}
      {members.length > 5 && (
        <Button variant="link" size="sm" className="px-0">View all {members.length} members</Button>
      )}
    </div>
  );
};

export default MemberListMinimal;
