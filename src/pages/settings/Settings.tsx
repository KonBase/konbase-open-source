import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isUsingDefaultCredentials } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { profile, updateProfile, loading } = useUserProfile();
  const { toast } = useToast();
  const usingDefaultCredentials = isUsingDefaultCredentials();
  
  const [enablingOTP, setEnablingOTP] = useState(false);
  const [disablingOTP, setDisablingOTP] = useState(false);
  const [showOTPSetup, setShowOTPSetup] = useState(false);
  const [otpSecret, setOtpSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [compactMode, setCompactMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const handleToggle2FA = async () => {
    if (profile?.two_factor_enabled) {
      // Disable 2FA
      setDisablingOTP(true);
      try {
        const { error } = await supabase.auth.mfa.unenroll();
        
        if (error) throw error;
        
        // Update profile
        await updateProfile({ two_factor_enabled: false });
        
        toast({
          title: 'Two-Factor Authentication Disabled',
          description: 'Your account is now less secure.',
        });
        
      } catch (error: any) {
        console.error('Error disabling 2FA:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to disable two-factor authentication',
          variant: 'destructive',
        });
      } finally {
        setDisablingOTP(false);
      }
    } else {
      // Enable 2FA
      setEnablingOTP(true);
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        });
        
        if (error) throw error;
        
        if (data) {
          setOtpSecret(data.totp.secret);
          setOtpUri(data.totp.uri);
          setShowOTPSetup(true);
        }
        
      } catch (error: any) {
        console.error('Error enabling 2FA:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to enable two-factor authentication',
          variant: 'destructive',
        });
      } finally {
        setEnablingOTP(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    setVerifyingOTP(true);
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
      });
      
      if (error) throw error;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId: data.id,
        code: otpCode,
      });
      
      if (verifyError) throw verifyError;
      
      // Update profile - Fix the error by passing the correct parameter
      await updateProfile({ two_factor_enabled: true });
      
      toast({
        title: 'Two-Factor Authentication Enabled',
        description: 'Your account is now more secure.',
      });
      
      setShowOTPSetup(false);
      setOtpCode('');
      
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP code',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(profile?.id || '');
      
      if (error) throw error;
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setDeletingAccount(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      {usingDefaultCredentials && (
        <Card className="border-yellow-500 dark:border-yellow-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              Demo Mode Active
            </CardTitle>
            <CardDescription>
              You are currently using default Supabase credentials. Some features may be limited or use mock data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>To access all features, you'll need to:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Create a Supabase project</li>
              <li>Run the database schema setup script</li>
              <li>Configure your environment variables</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.open('https://supabase.com', '_blank')}>
              Learn More
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">User ID</p>
                <p className="text-sm text-muted-foreground mt-1">{profile?.id || 'Loading...'}</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground mt-1">{profile?.email || 'Loading...'}</p>
              </div>
              <div>
                <p className="font-medium">Name</p>
                <p className="text-sm text-muted-foreground mt-1">{profile?.name || 'Loading...'}</p>
              </div>
              <div>
                <p className="font-medium">Role</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{profile?.role || 'Loading...'}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">
                Account created on {profile ? new Date(profile.created_at).toLocaleDateString() : 'Loading...'}
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle">Dark Mode</Label>
                <Switch 
                  id="theme-toggle" 
                  checked={darkMode}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch 
                  id="compact-mode" 
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch 
                  id="push-notifications" 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alert-notifications">Alert Notifications</Label>
                <Switch 
                  id="alert-notifications"
                  checked={alertNotifications}
                  onCheckedChange={setAlertNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security preferences and two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch 
                  id="two-factor" 
                  checked={profile?.two_factor_enabled || false}
                  onCheckedChange={() => handleToggle2FA()}
                  disabled={enablingOTP || disablingOTP || loading || showOTPSetup}
                />
              </div>

              {showOTPSetup && (
                <div className="mt-4 p-4 border rounded-md space-y-4">
                  <h3 className="font-medium">Setup Two-Factor Authentication</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div className="flex justify-center py-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpUri)}&size=200x200&margin=10`}
                        alt="QR Code"
                        className="w-48 h-48 border rounded-md"
                      />
                    </div>
                    <p className="text-sm mb-2">
                      2. Or manually enter this code in your authenticator app:
                    </p>
                    <Input
                      readOnly
                      value={otpSecret}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="font-mono text-center"
                    />
                    
                    <p className="text-sm mt-4 mb-2">
                      3. Enter the verification code from your authenticator app:
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        value={otpCode}
                        onChange={setOtpCode}
                        maxLength={6}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowOTPSetup(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleVerifyOTP} 
                      disabled={otpCode.length !== 6 || verifyingOTP}
                    >
                      {verifyingOTP ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Activate'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      window.location.href = '/login';
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                >
                  Sign Out From All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
