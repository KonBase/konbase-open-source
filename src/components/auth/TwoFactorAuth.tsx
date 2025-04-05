
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const TwoFactorAuth = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isRecoveryShown, setIsRecoveryShown] = useState(false);
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  
  const { toast } = useToast();
  const { profile, updateProfile, refreshProfile } = useUserProfile();

  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.two_factor_enabled || false);
    }
  }, [profile]);

  const startSetup = async () => {
    try {
      setIsSettingUp(true);
      
      // Generate the secret key through Supabase function
      const { data, error } = await supabase.functions.invoke('generate-totp-secret', {});
      
      if (error) throw error;
      
      if (data && data.secret) {
        const { secret, keyUri } = data;
        setSecret(secret);
        
        // Generate QR code
        try {
          const qrCodeImage = await QRCode.toDataURL(keyUri);
          setQrCode(qrCodeImage);
        } catch (err) {
          console.error('Error generating QR code:', err);
          toast({
            variant: "destructive",
            title: "Error generating QR code",
            description: "Please try again or use the manual code instead.",
          });
        }
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        variant: "destructive",
        title: "Error setting up 2FA",
        description: "There was a problem generating your 2FA secret. Please try again.",
      });
    }
  };
  
  const copySecretToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setHasCopied(true);
      toast({
        title: "Secret copied",
        description: "The secret key has been copied to your clipboard.",
      });
      
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }
  };
  
  const verifyAndEnable = async () => {
    if (!secret || verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
      });
      return;
    }
    
    try {
      setIsVerifying(true);
      
      // Verify the code through Supabase function
      const { data, error } = await supabase.functions.invoke('verify-totp', {
        body: { 
          secret, 
          token: verificationCode 
        }
      });
      
      if (error) throw error;
      
      if (data && data.verified) {
        setIsConfirmed(true);
        
        // Generate recovery keys
        await generateRecoveryKeys();
        
        toast({
          title: "Verification successful",
          description: "Your verification code is correct. Please save your recovery keys.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: "The verification code is incorrect or has expired. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast({
        variant: "destructive",
        title: "Error verifying code",
        description: "There was a problem verifying your 2FA code. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const generateRecoveryKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      
      // Generate recovery keys through Supabase function
      const { data, error } = await supabase.functions.invoke('generate-recovery-keys', {
        body: { count: 8 }
      });
      
      if (error) throw error;
      
      if (data && data.keys) {
        setRecoveryKeys(data.keys);
        setIsRecoveryShown(true);
      }
    } catch (error) {
      console.error('Error generating recovery keys:', error);
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
      // Store the 2FA secret and recovery keys in the database
      const { data, error } = await supabase.functions.invoke('complete-2fa-setup', {
        body: { 
          secret,
          recoveryKeys
        }
      });
      
      if (error) throw error;
      
      // Update the profile
      await updateProfile({ two_factor_enabled: true });
      await refreshProfile();
      
      setIsEnabled(true);
      setIsSettingUp(false);
      setIsConfirmed(false);
      setIsRecoveryShown(false);
      setSecret(null);
      setQrCode(null);
      setVerificationCode('');
      setRecoveryKeys([]);
      setHasConfirmedBackup(false);
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
    } catch (error) {
      console.error('Error completing 2FA setup:', error);
      toast({
        variant: "destructive",
        title: "Error enabling 2FA",
        description: "There was a problem enabling 2FA for your account. Please try again.",
      });
    }
  };

  const disable2FA = async () => {
    try {
      // Call Supabase function to disable 2FA
      const { data, error } = await supabase.functions.invoke('disable-2fa', {});
      
      if (error) throw error;
      
      // Update the profile
      await updateProfile({ two_factor_enabled: false });
      await refreshProfile();
      
      setIsEnabled(false);
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        variant: "destructive",
        title: "Error disabling 2FA",
        description: "There was a problem disabling 2FA for your account. Please try again.",
      });
    }
  };

  // Display different content based on the current state
  if (isEnabled && !isSettingUp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Your account is protected with two-factor authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTitle>2FA is enabled</AlertTitle>
            <AlertDescription>
              Your account has an extra layer of security. You'll need to enter a verification code when you log in.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={disable2FA}>Disable 2FA</Button>
        </CardContent>
      </Card>
    );
  }

  if (isSettingUp && !isConfirmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>Secure your account with an authenticator app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCode ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="QR Code for 2FA" className="border p-2 rounded-md" />
                </div>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Or enter this code manually in your authenticator app:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{secret}</code>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={copySecretToClipboard}
                      className="h-8 w-8"
                    >
                      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-code">Enter the 6-digit code from your authenticator app</Label>
                <div className="flex flex-col space-y-2">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} {...slot} index={index} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSettingUp(false)}>
                  Cancel
                </Button>
                <Button onClick={verifyAndEnable} disabled={verificationCode.length !== 6 || isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-center mb-4">
                To set up two-factor authentication, you'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
              </p>
              <Button onClick={startSetup}>
                Start Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isConfirmed && isRecoveryShown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save Your Recovery Keys</CardTitle>
          <CardDescription>
            Store these recovery keys in a safe place. You'll need them if you lose access to your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setIsSettingUp(false)}>
            Cancel
          </Button>
          <Button onClick={completeSetup} disabled={!hasConfirmedBackup || isGeneratingKeys}>
            {isGeneratingKeys ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Enable 2FA"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="mb-4">
          <AlertTitle>Enhance your account security</AlertTitle>
          <AlertDescription>
            Two-factor authentication adds an extra layer of security to your account. In addition to your password, you'll need a code from your authenticator app to sign in.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setIsSettingUp(true)}>Set Up 2FA</Button>
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
