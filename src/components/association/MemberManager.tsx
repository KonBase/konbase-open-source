
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import { UsersIcon, UserX, ShieldAlert, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InviteMemberDialog from './InviteMemberDialog';

interface MemberManagerProps {
  minimal?: boolean;
}

const MemberManager: React.FC<MemberManagerProps> = ({ minimal = false }) => {
  const { members, loading, updateMemberRole, removeMember, acceptInvitation } = useAssociationMembers();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the association?`)) {
      await removeMember(memberId);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingCode(true);
    try {
      const success = await acceptInvitation(inviteCode.trim());
      if (success) {
        setIsJoinDialogOpen(false);
        setInviteCode('');
      }
    } finally {
      setIsProcessingCode(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
          {members.length === 0 ? (
            <div className="text-center py-6">
              <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No members yet</p>
            </div>
          ) : (
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
          )}
        </CardContent>

        {/* Join Dialog */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Association</DialogTitle>
              <DialogDescription>
                Enter the invitation code you received to join this association.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invitation Code</Label>
                <Input
                  id="invite-code"
                  placeholder="Enter invitation code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsJoinDialogOpen(false);
                  setInviteCode('');
                }}
                disabled={isProcessingCode}
              >
                Cancel
              </Button>
              <Button onClick={handleAcceptInvitation} disabled={isProcessingCode}>
                {isProcessingCode ? 'Processing...' : 'Join Association'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={member.profileImage || ''} alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.id === user?.id ? (
                        <div className="flex items-center gap-1">
                          <span className="capitalize">{member.role}</span>
                          {member.role === 'admin' || member.role === 'manager' ? (
                            <ShieldAlert className="h-4 w-4 text-primary" />
                          ) : (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={value => handleRoleChange(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Join Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Association</DialogTitle>
            <DialogDescription>
              Enter the invitation code you received to join this association.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invitation Code</Label>
              <Input
                id="invite-code"
                placeholder="Enter invitation code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsJoinDialogOpen(false);
                setInviteCode('');
              }}
              disabled={isProcessingCode}
            >
              Cancel
            </Button>
            <Button onClick={handleAcceptInvitation} disabled={isProcessingCode}>
              {isProcessingCode ? 'Processing...' : 'Join Association'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManager;
