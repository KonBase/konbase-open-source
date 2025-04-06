
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import { UsersIcon } from 'lucide-react';
import InviteMemberDialog from './InviteMemberDialog';
import InviteCodeDialog from './InviteCodeDialog';
import MemberList from './MemberList';
import MemberListMinimal from './MemberListMinimal';
import MemberLoadingState from './MemberLoadingState';

interface MemberManagerProps {
  minimal?: boolean;
}

const MemberManager: React.FC<MemberManagerProps> = ({ minimal = false }) => {
  const { members, loading, updateMemberRole, removeMember, acceptInvitation } = useAssociationMembers();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the association?`)) {
      await removeMember(memberId);
    }
  };

  const handleAcceptInvitation = async (code: string) => {
    return await acceptInvitation(code);
  };

  if (loading) {
    return <MemberLoadingState />;
  }

  // Minimal view for dashboard
  if (minimal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Association Members</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsJoinDialogOpen(true)}>
              Join
            </Button>
            <InviteMemberDialog onInviteSent={() => {}} />
          </div>
        </CardHeader>
        <CardContent>
          <MemberListMinimal members={members} />
          
          <InviteCodeDialog 
            isOpen={isJoinDialogOpen}
            onOpenChange={setIsJoinDialogOpen}
            onAcceptInvitation={handleAcceptInvitation}
          />
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Association Members</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline">
            Join with Code
          </Button>
          <InviteMemberDialog onInviteSent={() => {}} />
        </div>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-10">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Members Yet</h3>
              <p className="mt-1 text-muted-foreground">
                Get started by inviting members to join your association.
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline">
                  Join with Code
                </Button>
                <InviteMemberDialog onInviteSent={() => {}} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <MemberList 
              members={members} 
              onRoleChange={handleRoleChange} 
              onRemoveMember={handleRemoveMember}
            />
          </CardContent>
        </Card>
      )}

      <InviteCodeDialog 
        isOpen={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onAcceptInvitation={handleAcceptInvitation}
      />
    </div>
  );
};

export default MemberManager;
