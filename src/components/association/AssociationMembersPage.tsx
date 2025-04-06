
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import { UserRoundPlus } from 'lucide-react';
import MemberList from './MemberList';
import MemberLoadingState from './MemberLoadingState';

interface AssociationMembersPageProps {
  associationId: string;
}

const AssociationMembersPage = ({ associationId }: AssociationMembersPageProps) => {
  const { members, loading, fetchMembers, updateMemberRole, removeMember } = useAssociationMembers(associationId);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Association Members</CardTitle>
        <Button variant="outline" size="sm">
          <UserRoundPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <MemberLoadingState />
        ) : (
          <MemberList 
            members={members} 
            onUpdateRole={updateMemberRole} 
            onRemoveMember={removeMember} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AssociationMembersPage;
