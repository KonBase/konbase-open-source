
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface TwoFactorStatusProps {
  isEnabled: boolean;
  onSetupStart: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const TwoFactorStatus: React.FC<TwoFactorStatusProps> = ({
  isEnabled,
  onSetupStart,
  errorMessage,
  setErrorMessage,
}) => {
  const [isDisabling, setIsDisabling] = useState(false);
  const { toast } = useToast();

  const disable2FA = async () => {
    try {
      setIsDisabling(true);
      setErrorMessage(null);
      
      const { error } = await supabase.functions.invoke('disable-2fa', {});
      
      if (error) {
        console.error('Error from disable-2fa function:', error);
        throw error;
      }
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
      
      // Force page reload to update profile status
      window.location.reload();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setErrorMessage('Failed to disable 2FA. Please try again.');
      toast({
        variant: "destructive",
        title: "Error disabling 2FA",
        description: "There was a problem disabling 2FA for your account. Please try again.",
      });
    } finally {
      setIsDisabling(false);
    }
  };
  
  if (isEnabled) {
    return (
      <>
        <Alert className="mb-4">
          <AlertTitle>2FA is enabled</AlertTitle>
          <AlertDescription>
            Your account has an extra layer of security. You'll need to enter a verification code when you log in.
          </AlertDescription>
        </Alert>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Button 
          variant="destructive" 
          onClick={disable2FA} 
          disabled={isDisabling}
        >
          {isDisabling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disabling...
            </>
          ) : (
            "Disable 2FA"
          )}
        </Button>
      </>
    );
  }
  
  return (
    <>
      <Alert className="mb-4">
        <AlertTitle>Enhance your account security</AlertTitle>
        <AlertDescription>
          Two-factor authentication adds an extra layer of security to your account. In addition to your password, you'll need a code from your authenticator app to sign in.
        </AlertDescription>
      </Alert>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Button onClick={onSetupStart}>Set Up 2FA</Button>
    </>
  );
};

export default TwoFactorStatus;
