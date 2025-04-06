
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';
import { UserRoundPlus } from 'lucide-react';
import MemberList from './MemberList';
import MemberLoadingState from './MemberLoadingState';

interface MemberManagerProps {
  associationId: string;
  members: AssociationMember[];
  loading: boolean;
  onUpdateRole: (memberId: string, role: UserRoleType) => Promise<{ success: boolean, error?: any }>;
  onRemoveMember: (memberId: string) => Promise<{ success: boolean, error?: any }>;
  onInviteMember?: () => void;
}

const MemberManager = ({ 
  associationId, 
  members, 
  loading, 
  onUpdateRole, 
  onRemoveMember, 
  onInviteMember 
}: MemberManagerProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Association Members</CardTitle>
        {onInviteMember && (
          <Button variant="outline" size="sm" onClick={onInviteMember}>
            <UserRoundPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <MemberLoadingState />
        ) : (
          <MemberList 
            members={members} 
            onUpdateRole={onUpdateRole} 
            onRemoveMember={onRemoveMember} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MemberManager;
