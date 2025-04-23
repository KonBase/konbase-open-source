// filepath: c:\Users\Artur\Documents\konbase-open-source\src\components\conventions\ConventionAttendeesPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoundPlus, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Profile } from '@/types/user'; // Assuming Profile type exists

interface ConventionAttendee {
  id: string; // convention_access id
  user_id: string;
  created_at: string;
  profile: Pick<Profile, 'id' | 'name' | 'email'> | null; // Include profile details
}

interface ConventionAttendeesPageProps {
  conventionId: string;
}

const ConventionAttendeesPage = ({ conventionId }: ConventionAttendeesPageProps) => {
  const [attendees, setAttendees] = useState<ConventionAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_access')
        .select(`
          id,
          user_id,
          created_at,
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
  
  // TODO: Implement Invite Attendee functionality (likely involves convention_invitations table)
  const handleInviteAttendee = () => {
     toast({
        title: 'Not Implemented',
        description: 'Inviting attendees is not yet implemented.',
        variant: 'default',
      });
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
                <div>
                  <p className="font-medium">{attendee.profile?.name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">{attendee.profile?.email || 'No email available'}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveAttendee(attendee.id, attendee.profile?.name)}
                  aria-label={`Remove ${attendee.profile?.name || 'attendee'}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ConventionAttendeesPage;
