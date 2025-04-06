
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug } from '@/utils/debug';

interface RecoveryKeyManagerProps {
  secret: string;
  onComplete: () => void;
  onCancel: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const RecoveryKeyManager: React.FC<RecoveryKeyManagerProps> = ({
  secret,
  onComplete,
  onCancel,
  errorMessage,
  setErrorMessage,
}) => {
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  
  const { toast } = useToast();

  React.useEffect(() => {
    generateRecoveryKeys();
  }, []);

  const generateRecoveryKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      setErrorMessage(null);
      
      logDebug('Generating recovery keys', null, 'info');
      
      const { data, error } = await supabase.functions.invoke('generate-recovery-keys', {
        body: { count: 8 }
      });
      
      if (error) throw error;
      
      if (data && data.keys) {
        setRecoveryKeys(data.keys);
        logDebug('Recovery keys generated successfully', { keyCount: data.keys.length }, 'info');
      }
    } catch (error) {
      console.error('Error generating recovery keys:', error);
      setErrorMessage('Failed to generate recovery keys. Please try again.');
      logDebug('Error generating recovery keys', error, 'error');
      toast({
        variant: "destructive",
        title: "Error generating recovery keys",
        description: "There was a problem generating recovery keys. Please try again.",
      });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const copyRecoveryKeys = () => {
    const keysText = recoveryKeys.join('\n');
    navigator.clipboard.writeText(keysText);
    
    toast({
      title: "Recovery keys copied",
      description: "Recovery keys have been copied to your clipboard. Store them securely.",
    });
  };

  const completeSetup = async () => {
    if (!hasConfirmedBackup) {
      toast({
        variant: "destructive",
        title: "Confirmation required",
        description: "Please confirm that you've backed up your recovery keys.",
      });
      return;
    }
    
    try {
      setIsEnabling(true);
      setErrorMessage(null);
      
      logDebug('Completing 2FA setup', { secretLength: secret.length, recoveryKeysCount: recoveryKeys.length }, 'info');
      
      const { data, error } = await supabase.functions.invoke('complete-2fa-setup', {
        body: { 
          secret,
          recoveryKeys
        }
      });
      
      if (error) {
        console.error('Error from complete-2fa-setup function:', error);
        throw error;
      }
      
      if (data && !data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      
      logDebug('2FA setup completed successfully', null, 'info');
      onComplete();
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
    } catch (error) {
      console.error('Error completing 2FA setup:', error);
      logDebug('Error completing 2FA setup', error, 'error');
      
      // Try to extract a more specific error message if available
      let errorMsg = 'Failed to enable 2FA. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = (error as any).message || (error as any).error || errorMsg;
      }
      
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "Error enabling 2FA",
        description: errorMsg,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          These recovery keys will only be shown once. If you lose them, you won't be able to recover your account if you lose access to your authenticator app.
        </AlertDescription>
      </Alert>
      <div className="bg-muted p-4 rounded-md">
        <div className="grid grid-cols-2 gap-2">
          {recoveryKeys.map((key, index) => (
            <code key={index} className="font-mono text-sm">
              {key}
            </code>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={copyRecoveryKeys}>
          Copy Keys
        </Button>
      </div>
      <div className="flex items-start space-x-2 pt-4">
        <Checkbox 
          id="confirm-backup" 
          checked={hasConfirmedBackup}
          onCheckedChange={(checked) => setHasConfirmedBackup(checked as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="confirm-backup">
            I have saved these recovery keys in a secure location
          </Label>
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={completeSetup} disabled={!hasConfirmedBackup || isEnabling}>
          {isEnabling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            "Enable 2FA"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RecoveryKeyManager;
