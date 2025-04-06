
import React, { useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import { UsersIcon } from 'lucide-react';
import InviteMemberDialog from './InviteMemberDialog';
import InviteCodeDialog from './InviteCodeDialog';
import MemberList from './MemberList';
import MemberListMinimal from './MemberListMinimal';
import MemberLoadingState from './MemberLoadingState';
import { useToast } from '@/components/ui/use-toast';

const AssociationMembersPage = () => {
  const { currentAssociation } = useAssociation();
  const { members, loading, updateMemberRole, removeMember, acceptInvitation } = useAssociationMembers();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const { toast } = useToast();

  if (!currentAssociation) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Association Found</CardTitle>
            <CardDescription>You need to set up your association first</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with EventNexus, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup">Set Up Association</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Association Members</h1>
          <p className="text-muted-foreground">Manage members and permissions for {currentAssociation.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline">
            Join with Code
          </Button>
          <InviteMemberDialog onInviteSent={() => {}} />
        </div>
      </div>
      
      {loading ? (
        <MemberLoadingState />
      ) : (
        <>
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
        </>
      )}

      <InviteCodeDialog 
        isOpen={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onAcceptInvitation={handleAcceptInvitation}
      />
    </div>
  );
};

export default AssociationMembersPage;
