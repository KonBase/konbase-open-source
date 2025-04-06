
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX, ShieldAlert, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { AssociationMember } from '@/hooks/useAssociationMembers';

interface MemberListProps {
  members: AssociationMember[];
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

const MemberList: React.FC<MemberListProps> = ({ 
  members, 
  onRoleChange, 
  onRemoveMember 
}) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
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
                  onValueChange={value => onRoleChange(member.id, value)}
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
                  onClick={() => onRemoveMember(member.id, member.name)}
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
  );
};

export default MemberList;
