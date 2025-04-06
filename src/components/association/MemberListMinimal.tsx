
import React from 'react';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MemberListMinimalProps {
  members: AssociationMember[];
}

const MemberListMinimal: React.FC<MemberListMinimalProps> = ({ members }) => {
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-2">
      {members.slice(0, 5).map(member => {
        const profileData = member.profile || {};
        const memberName = profileData.name || 'Unknown User';
        const memberProfileImage = profileData.profile_image;
        
        return (
          <div key={member.id} className="flex items-center justify-between p-2 rounded-md border">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={memberProfileImage || ''} alt={memberName} />
                <AvatarFallback>{getInitials(memberName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{memberName}</span>
            </div>
            <Badge variant={member.role === 'admin' ? "default" : "secondary"} className="text-xs">
              {member.role}
            </Badge>
          </div>
        );
      })}
      
      {members.length > 5 && (
        <div className="text-sm text-center text-muted-foreground">
          +{members.length - 5} more members
        </div>
      )}
    </div>
  );
};

export default MemberListMinimal;
