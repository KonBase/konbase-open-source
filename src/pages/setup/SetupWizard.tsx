
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AssociationForm from '@/components/setup/AssociationForm';
import InvitationCodeForm from '@/components/setup/InvitationCodeForm';
import SetupHeader from '@/components/setup/SetupHeader';

type SetupStep = 'choose' | 'create' | 'join';

const SetupWizard = () => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('choose');
  const [loading, setLoading] = useState(false);
  const { user, isLoading, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Redirect based on user role if they're already in an association
  useEffect(() => {
    if (!isLoading && user) {
      if (userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin') {
        // For admins, redirect to dashboard
        navigate('/dashboard');
      } else if (userProfile?.association_id) {
        // If user is already in an association, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, userProfile, navigate]);
  
  const handleCreateSuccess = () => {
    toast({
      title: "Association created successfully",
      description: "You're now the admin of this association",
    });
    navigate('/dashboard');
  };
  
  const handleJoinSuccess = () => {
    toast({
      title: "Joined association",
      description: "You've successfully joined the association",
    });
    navigate('/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl min-h-screen flex flex-col">
      <SetupHeader />
      
      <div className="flex-1 flex items-center justify-center py-12">
        {currentStep === 'choose' && (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Create a new association or join an existing one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setCurrentStep('create')}
                >
                  Create a New Association
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep('join')}
                >
                  Join an Existing Association
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === 'create' && (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create Association</CardTitle>
              <CardDescription>
                Set up your new association
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssociationForm onSuccess={handleCreateSuccess} />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('choose')}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === 'join' && (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Join Association</CardTitle>
              <CardDescription>
                Enter your invitation code to join an association
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationCodeForm onSuccess={handleJoinSuccess} />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('choose')}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
