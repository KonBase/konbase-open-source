
import React, { useEffect, useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CopyIcon, PlusIcon, TrashIcon, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string | null;
}

const AssociationMembers = () => {
  const { currentAssociation } = useAssociation();
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationRole, setInvitationRole] = useState('member');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentAssociation) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('association_members')
          .select(`
            user_id,
            role,
            profiles:user_id (
              id, 
              name, 
              email,
              profile_image
            )
          `)
          .eq('association_id', currentAssociation.id);
        
        if (error) throw error;
        
        const formattedMembers = data.map(item => ({
          id: item.profiles.id,
          name: item.profiles.name,
          email: item.profiles.email,
          role: item.role,
          profileImage: item.profiles.profile_image
        }));
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Error",
          description: "Failed to load association members.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [currentAssociation]);

  const handleInviteMember = async () => {
    if (!invitationEmail || !currentAssociation) return;
    
    setIsInviting(true);
    try {
      // In a real implementation, this would send an email with invitation
      // For now, we'll just create a placeholder member
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invitationEmail)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (!existingUser) {
        // In a real implementation, this would create an invitation record
        toast({
          title: "User Not Found",
          description: "No user with that email address found in the system.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('association_members')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .eq('user_id', existingUser.id)
        .maybeSingle();
        
      if (memberError) throw memberError;
      
      if (existingMember) {
        toast({
          title: "Already a Member",
          description: "This user is already a member of your association.",
          variant: "destructive"
        });
        return;
      }
      
      // Add the user to the association_members table
      const { error: insertError } = await supabase
        .from('association_members')
        .insert({
          association_id: currentAssociation.id,
          user_id: existingUser.id,
          role: invitationRole
        });
        
      if (insertError) throw insertError;
      
      // Get user details to add to the UI
      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, profile_image')
        .eq('id', existingUser.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Add the new member to the list
      setMembers(prev => [...prev, {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: invitationRole,
        profileImage: userData.profile_image
      }]);
      
      toast({
        title: "Member Added",
        description: "Successfully added member to your association.",
      });
      
      setIsDialogOpen(false);
      setInvitationEmail('');
      setInvitationRole('member');
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: "Failed to add member to association.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!currentAssociation) return;
    
    try {
      const { error } = await supabase
        .from('association_members')
        .update({ role: newRole })
        .eq('association_id', currentAssociation.id)
        .eq('user_id', memberId);
        
      if (error) throw error;
      
      // Update the local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      
      toast({
        title: "Role Updated",
        description: "Member's role has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update member's role.",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!currentAssociation) return;
    
    try {
      const { error } = await supabase
        .from('association_members')
        .delete()
        .eq('association_id', currentAssociation.id)
        .eq('user_id', memberId);
        
      if (error) throw error;
      
      // Update the local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: "Member Removed",
        description: "Member has been removed from your association.",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive"
      });
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Association Members</h1>
          <p className="text-muted-foreground">Manage members and permissions for your association.</p>
        </div>
        {hasPermission('manager') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the user you want to add to your association.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={invitationEmail}
                    onChange={(e) => setInvitationEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={invitationRole} onValueChange={setInvitationRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      {hasPermission('admin') && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteMember} 
                  disabled={!invitationEmail || isInviting}
                >
                  {isInviting ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No members found in this association.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {hasPermission('manager') && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.profileImage ? (
                            <img 
                              src={member.profileImage} 
                              alt={member.name} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {hasPermission('manager') ? (
                        <Select 
                          defaultValue={member.role} 
                          onValueChange={(value) => updateMemberRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            {hasPermission('admin') && (
                              <SelectItem value="admin">Admin</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize">{member.role}</span>
                      )}
                    </TableCell>
                    {hasPermission('manager') && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeMember(member.id)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssociationMembers;
