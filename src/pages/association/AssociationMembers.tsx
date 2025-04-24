import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAssociationMembers, AssociationMember, ProfileData } from '@/hooks/useAssociationMembers';
import { UserRoleType, USER_ROLES } from '@/types/user';
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { UsersRound, UserRoundCog, UserRoundX, Building2, ArrowLeft } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import InviteMemberDialog from '@/components/association/InviteMemberDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

const AssociationMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAssociation } = useAssociation();
  const associationId = id || (currentAssociation?.id || '');
  const { members, loading, fetchMembers, updateMemberRole, removeMember } = useAssociationMembers(associationId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<AssociationMember | null>(null);
  const [newRole, setNewRole] = useState<UserRoleType | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  
  // Use profile.role to determine admin status (consistent with other components)
  const { profile } = useUserProfile();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Format member data for display
  const getMemberDisplayData = (member: AssociationMember) => {
    const profile = member.profile as ProfileData;
    return {
      id: profile?.id || member.user_id,
      name: profile?.name || 'Unknown User',
      email: profile?.email || 'No email',
      role: member.role,
      roleDisplay: USER_ROLES[member.role]?.name || member.role,
      profileImage: profile?.profile_image,
    };
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return;
    
    const result = await updateMemberRole(selectedMember.id, newRole as UserRoleType);
    if (result.success) {
      setDialogOpen(false);
      setNewRole('');
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    const result = await removeMember(selectedMember.id);
    if (result.success) {
      setRemoveDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const openRoleDialog = (member: AssociationMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setDialogOpen(true);
  };

  const openRemoveDialog = (member: AssociationMember) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with back navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Association Members</h1>
            {currentAssociation && (
              <p className="text-muted-foreground flex items-center">
                <Building2 className="h-4 w-4 mr-1 inline-block" />
                {currentAssociation.name}
              </p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <InviteMemberDialog onInviteSent={fetchMembers} />
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersRound className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p>No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map(member => {
                const memberData = getMemberDisplayData(member);
                const isSelf = user?.id === memberData.id;
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={memberData.profileImage || undefined} />
                        <AvatarFallback>{getInitials(memberData.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{memberData.name} {isSelf && <Badge variant="outline">You</Badge>}</p>
                        <p className="text-sm text-muted-foreground">{memberData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={memberData.role === 'admin' ? "default" : "secondary"}>
                        {memberData.roleDisplay}
                      </Badge>
                      {isAdmin && !isSelf && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRoleDialog(member)}
                            title="Change role"
                          >
                            <UserRoundCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRemoveDialog(member)}
                            title="Remove member"
                          >
                            <UserRoundX className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.profile?.name || 'this member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role" className="mb-2 block">Role</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRoleType)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.profile?.name || 'this member'} from the association?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveMember}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssociationMembers;
