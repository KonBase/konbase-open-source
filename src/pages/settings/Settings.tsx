import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Settings = () => {
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { updateProfile } = useUserProfile();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const handleThemeChange = (theme: string) => {
    // Implement theme change logic here
    toast({
      title: "Theme changed",
      description: `Theme has been changed to ${theme}.`,
    });
  };

  const handleTwoFactorChange = async (enabled: boolean) => {
    setIsTwoFactorEnabled(enabled);
    const result = await updateProfile({ two_factor_enabled: enabled });

    if (result && result.success) {
      toast({
        title: "2FA settings updated",
        description: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error updating 2FA settings",
        description: result?.error || 'Failed to update 2FA settings.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        
        <Tabs defaultValue="account">
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1">Your email address</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Theme</p>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <Switch id="2fa" checked={isTwoFactorEnabled} onCheckedChange={handleTwoFactorChange} />
                  </div>
                  {isTwoFactorEnabled ? (
                    <Alert>
                      <AlertTitle>Two-Factor Authentication Enabled</AlertTitle>
                      <AlertDescription>
                        Ensure you have set up your 2FA method.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertTitle>Two-Factor Authentication Disabled</AlertTitle>
                      <AlertDescription>
                        Enable 2FA for enhanced security.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Notification Settings</p>
                  <p className="text-muted-foreground">Configure your notification preferences here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Backup Settings */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Backup Management</CardTitle>
                <CardDescription>Manage and restore backups of your association data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Button onClick={() => navigate('/settings/backup')} className="mb-4">
                  Go to Backup Management
                </Button>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                  Create, download, and restore backups of your association data. Regular backups help prevent data loss.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
