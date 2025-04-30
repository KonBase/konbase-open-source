// filepath: c:\Users\Artur\Documents\konbase-open-source\src\components\conventions\ConventionAttendeesPage.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoundPlus, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InviteAttendeeDialog } from '@/components/conventions/InviteAttendeeDialog';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface ConventionAttendee {
  id: string; // convention_access id
  user_id: string;
  created_at: string;
  role: string; // Updated to include role
  profile: Pick<Profile, 'id' | 'name' | 'email'> | null; // Include profile details
}

interface ConventionAttendeesPageProps {
  conventionId: string;
}

const ConventionAttendeesPage = ({ conventionId }: ConventionAttendeesPageProps) => {
  const [attendees, setAttendees] = useState<ConventionAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [canManageRoles, setCanManageRoles] = useState(false);
  const { toast } = useToast();

  const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      // First check if current user can manage this convention
      const { data: canManageData, error: canManageError } = await supabase
        .rpc('can_manage_convention', { p_convention_id: conventionId });
      
      if (canManageError) throw canManageError;
      setCanManageRoles(canManageData || false);

      // Fetch attendees with their roles
      const { data, error } = await supabase
        .from('convention_access')
        .select(`
          id,
          user_id,
          created_at,
          role,
          profile:profiles ( id, name, email ) 
        `)
        .eq('convention_id', conventionId);

      if (error) throw error;
      
      // Filter out entries where profile might be null if needed, or handle display appropriately
      setAttendees(data || []); 

    } catch (error: any) {
      console.error('Error fetching convention attendees:', error);
      toast({
        title: 'Error loading attendees',
        description: error.message || 'Could not fetch attendee list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conventionId) {
      fetchAttendees();
    }
  }, [conventionId]);

  const handleRemoveAttendee = async (accessId: string, attendeeName: string | null | undefined) => {
    const name = attendeeName || 'this attendee';
    if (!confirm(`Are you sure you want to remove ${name} from this convention?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('convention_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: 'Attendee Removed',
        description: `${name} has been removed from the convention.`,
      });
      fetchAttendees(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing attendee:', error);
      toast({
        title: 'Error Removing Attendee',
        description: error.message || 'Could not remove the attendee.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateRole = async (accessId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('convention_access')
        .update({ role: newRole })
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: 'Role Updated',
        description: 'The attendee role has been updated successfully.',
      });
      
      // Update local state
      setAttendees(attendees.map(attendee => 
        attendee.id === accessId 
          ? { ...attendee, role: newRole } 
          : attendee
      ));
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error Updating Role',
        description: error.message || 'Could not update the role.',
        variant: 'destructive',
      });
    }
  };
  
  const handleInviteAttendee = () => {
    setIsInviteDialogOpen(true);
  };

  const handleInviteSent = () => {
    setIsInviteDialogOpen(false);
    fetchAttendees(); // Refresh the attendee list
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Badge variant="default">Organizer</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'helper':
        <Badge variant="outline" className={'bg-orange-600'}>Helper</Badge>
      case 'attendee':
      default:
        return <Badge variant="outline" className="bg-muted">Attendee</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Convention Attendees</CardTitle>
          <CardDescription>Manage users who have access to this convention.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleInviteAttendee}>
          <UserRoundPlus className="mr-2 h-4 w-4" />
          Invite Attendee
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spinner />
            <p className="ml-2 text-muted-foreground">Loading attendees...</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No attendees found for this convention yet.</p>
            <Button variant="outline" className="mt-4" onClick={handleInviteAttendee}>
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Invite First Attendee
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {attendees.map((attendee) => (
              <li key={attendee.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{attendee.profile?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{attendee.profile?.email || 'No email available'}</p>
                  </div>
                  <div>
                    {getRoleBadge(attendee.role)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageRoles && (
                    <Select
                      defaultValue={attendee.role}
                      onValueChange={(value) => handleUpdateRole(attendee.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organizer">Organizer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="helper">Helper</SelectItem>
                        <SelectItem value="attendee">Attendee</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveAttendee(attendee.id, attendee.profile?.name)}
                    aria-label={`Remove ${attendee.profile?.name || 'attendee'}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {/* Invite Attendee Dialog */}
        <InviteAttendeeDialog 
          isOpen={isInviteDialogOpen}
          conventionId={conventionId}
          onClose={() => setIsInviteDialogOpen(false)}
          onInviteSent={handleInviteSent}
        />
      </CardContent>
    </Card>
  );
};

export default ConventionAttendeesPage;
