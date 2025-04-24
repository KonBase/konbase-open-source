import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';
import { logDebug, handleError } from '@/utils/debug';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get invitation code from URL params if it exists
        const invitationCode = searchParams.get('invitation_code');
        
        // Process OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        // If we have a session and an invitation code, process the invitation
        if (data.session && invitationCode) {
          await processInvitationCode(data.session.user.id, invitationCode);
        } else if (data.session) {
          // We have a session but no invitation code - check if user has an association
          const { data: profileData } = await supabase
            .from('profiles')
            .select('association_id')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData && profileData.association_id) {
            // User already has an association, go to dashboard
            navigate('/dashboard');
          } else {
            // No association, go to create first association
            navigate('/setup/create-association');
          }
        } else {
          // No session, redirect to login
          navigate('/login');
        }
      } catch (err: any) {
        handleError(err, 'AuthCallback.handleCallback');
        setError(err.message || 'An error occurred during authentication.');
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: err.message || "Something went wrong. Please try again.",
        });
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after showing error
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  // Function to process invitation code and set up appropriate permissions
  const processInvitationCode = async (userId: string, code: string) => {
    // Check for association invitation
    const { data: assocData, error: assocError } = await supabase
      .from('association_invitations')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .maybeSingle();

    if (assocError) {
      logDebug('Error checking association invitation', assocError, 'error');
    } else if (assocData) {
      // Process association invitation
      await processAssociationInvitation(userId, assocData);
      return;
    }

    // If no association invitation found, check for convention invitation
    const { data: convData, error: convError } = await supabase
      .from('convention_invitations')
      .select('*')
      .eq('code', code)
      .gt('uses_remaining', 0)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (convError) {
      logDebug('Error checking convention invitation', convError, 'error');
    } else if (convData) {
      // Process convention invitation
      await processConventionInvitation(userId, convData, code);
      return;
    }

    // If we get here, the invitation code was invalid or expired
    toast({
      variant: "destructive",
      title: "Invalid invitation code",
      description: "The invitation code you provided is invalid or has expired.",
    });
    
    // Check if user has an association
    const { data: profileData } = await supabase
      .from('profiles')
      .select('association_id')
      .eq('id', userId)
      .single();
      
    if (profileData && profileData.association_id) {
      // User already has an association, go to dashboard
      navigate('/dashboard');
    } else {
      // No association, go to create first association
      navigate('/setup/create-association');
    }
  };

  // Process an association invitation
  const processAssociationInvitation = async (userId: string, invitation: any) => {
    try {
      // Add user to association with proper role
      const { error: memberError } = await supabase
        .from('association_members')
        .insert({
          user_id: userId,
          association_id: invitation.association_id,
          role: invitation.role,
        });

      if (memberError) {
        logDebug('Error adding user to association', memberError, 'error');
        toast({
          variant: "destructive",
          title: "Error setting up association access",
          description: "There was an issue with your association access. Please contact an administrator.",
        });
      } else {
        // Update user's primary association and role in profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            association_id: invitation.association_id,
            role: invitation.role,
          })
          .eq('id', userId);

        if (profileError) {
          logDebug('Error updating user profile with association', profileError, 'error');
        }

        // Mark invitation as used
        const { error: invitationError } = await supabase
          .from('association_invitations')
          .update({
            used: true,
            used_by: userId,
            used_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);

        if (invitationError) {
          logDebug('Error marking invitation as used', invitationError, 'error');
        }
        
        toast({
          title: "Association access granted",
          description: "You now have access to the association.",
        });
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'AuthCallback.processAssociationInvitation');
      toast({
        variant: "destructive",
        title: "Error processing invitation",
        description: error.message || "Failed to process your invitation. Please try again or contact support.",
      });
    }
  };

  // Process a convention invitation
  const processConventionInvitation = async (userId: string, invitation: any, code: string) => {
    try {
      // Add user to convention access with proper role
      const { error: accessError } = await supabase
        .from('convention_access')
        .insert({
          user_id: userId,
          convention_id: invitation.convention_id,
          role: invitation.role,
          invitation_code: code,
        });

      if (accessError) {
        logDebug('Error adding user to convention', accessError, 'error');
        toast({
          variant: "destructive",
          title: "Error setting up convention access",
          description: "There was an issue with your convention access. Please contact an administrator.",
        });
      } else {
        // Decrease the uses_remaining count for the invitation
        const { error: invitationError } = await supabase
          .from('convention_invitations')
          .update({
            uses_remaining: invitation.uses_remaining - 1,
          })
          .eq('id', invitation.id);

        if (invitationError) {
          logDebug('Error updating invitation uses count', invitationError, 'error');
        }
        
        toast({
          title: "Convention access granted",
          description: "You now have access to the convention.",
        });
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'AuthCallback.processConventionInvitation');
      toast({
        variant: "destructive",
        title: "Error processing invitation",
        description: error.message || "Failed to process your invitation. Please try again or contact support.",
      });
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" className="mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we complete your sign-in process.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-destructive/20 p-4 rounded-lg mb-4">
          <p className="font-semibold text-destructive">Authentication Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <p>Redirecting to login page...</p>
      </div>
    );
  }

  return null;
};

export default AuthCallback;