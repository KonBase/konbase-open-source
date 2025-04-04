
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
import { supabase, isUsingDefaultCredentials } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AlertCircle } from 'lucide-react';

const Settings = () => {
  const { profile } = useUserProfile();
  const usingDefaultCredentials = isUsingDefaultCredentials();
  
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
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Account created on {profile ? new Date(profile.created_at).toLocaleDateString() : 'Loading...'}
              </p>
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
                <Switch id="theme-toggle" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch id="compact-mode" />
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
                <Switch id="email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch id="push-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alert-notifications">Alert Notifications</Label>
                <Switch id="alert-notifications" />
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
                <Switch id="two-factor" checked={profile?.two_factor_enabled} />
              </div>
              <div className="pt-4">
                <Button variant="destructive">Sign Out From All Devices</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
