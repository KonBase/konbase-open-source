
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

interface TwoFactorSetupProps {
  onVerified: (secret: string) => void;
  onCancel: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onVerified,
  onCancel,
  errorMessage,
  setErrorMessage,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  const { toast } = useToast();

  const startSetup = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase.functions.invoke('generate-totp-secret', {});
      
      if (error) {
        console.error("Error generating TOTP secret:", error);
        throw error;
      }
      
      if (data && data.secret) {
        const { secret, keyUri } = data;
        setSecret(secret);
        
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
      setErrorMessage('Failed to set up 2FA. Please try again.');
      toast({
        variant: "destructive",
        title: "Error setting up 2FA",
        description: "There was a problem generating your 2FA secret. Please try again.",
      });
    } finally {
      setIsGenerating(false);
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
      setErrorMessage(null);
      
      console.log("Verifying TOTP with secret:", secret, "and token:", verificationCode);
      
      const { data, error } = await supabase.functions.invoke('verify-totp', {
        body: { 
          secret, 
          token: verificationCode 
        }
      });
      
      if (error) {
        console.error("Verification API error:", error);
        throw error;
      }
      
      if (data && data.verified) {
        onVerified(secret);
        
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
      setErrorMessage('Failed to verify code. Please try again with a new code.');
      toast({
        variant: "destructive",
        title: "Error verifying code",
        description: "There was a problem verifying your 2FA code. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle OTP input completion
  useEffect(() => {
    if (verificationCode.length === 6 && secret) {
      verifyAndEnable();
    }
  }, [verificationCode]);

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {qrCode ? (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="QR Code for 2FA" className="border p-2 rounded-md" width="200" height="200" />
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-muted-foreground">
                Or enter this code manually in your authenticator app:
              </p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all">{secret}</code>
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
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
          <Button onClick={startSetup} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Start Setup"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
