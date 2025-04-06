
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Shield, 
  User, 
  Lock, 
  Globe, 
  Moon, 
  Sun, 
  Laptop, 
  Languages,
  ToggleLeft,
  ToggleRight,
  Maximize,
  MessageSquare,
  Eye
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { enableDebugMode, isDebugModeEnabled } from '@/utils/debug';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Settings = () => {
  const { profile, loading, refreshProfile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(() => isDebugModeEnabled());
  const [animations, setAnimations] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    conventions: true,
    inventory: true,
    messages: true,
    updates: true
  });

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleDebugModeToggle = () => {
    const newValue = !isDebugMode;
    setIsDebugMode(newValue);
    enableDebugMode(newValue);
    
    toast({
      title: newValue ? "Debug mode enabled" : "Debug mode disabled",
      description: newValue 
        ? "Additional debugging information is now available." 
        : "Debug mode has been turned off.",
    });
  };
  
  const saveAccountSettings = async () => {
    setIsFormSaving(true);
    
    try {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings updated",
        description: "Your account settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: "There was a problem saving your settings. Please try again.",
      });
    } finally {
      setIsFormSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-5 mb-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span className="hidden md:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Language</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={profile?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ''} />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Show additional debugging information
                    </p>
                  </div>
                  <Switch 
                    id="debug-mode" 
                    checked={isDebugMode} 
                    onCheckedChange={handleDebugModeToggle} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Marketing emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and updates
                    </p>
                  </div>
                  <Switch id="marketing" defaultChecked={true} />
                </div>
                
                <Button onClick={saveAccountSettings} disabled={isFormSaving}>
                  {isFormSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Theme</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={theme === 'light' ? 'default' : 'outline'} 
                        className="flex flex-col items-center justify-center gap-1 h-24"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="h-6 w-6" />
                        <span>Light</span>
                      </Button>
                      <Button 
                        variant={theme === 'dark' ? 'default' : 'outline'} 
                        className="flex flex-col items-center justify-center gap-1 h-24"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="h-6 w-6" />
                        <span>Dark</span>
                      </Button>
                      <Button 
                        variant={theme === 'system' ? 'default' : 'outline'} 
                        className="flex flex-col items-center justify-center gap-1 h-24"
                        onClick={() => setTheme('system')}
                      >
                        <Laptop className="h-6 w-6" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="animations">Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable UI animations and transitions
                      </p>
                    </div>
                    <Switch 
                      id="animations" 
                      checked={animations}
                      onCheckedChange={setAnimations}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="large-text">Large Text</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase the size of text for better readability
                      </p>
                    </div>
                    <Switch 
                      id="large-text" 
                      checked={largeText}
                      onCheckedChange={setLargeText}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="contrast">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhance visibility with higher contrast colors
                      </p>
                    </div>
                    <Switch 
                      id="contrast" 
                      checked={highContrast}
                      onCheckedChange={setHighContrast}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Density</Label>
                    <ToggleGroup type="single" defaultValue="comfortable" className="justify-start">
                      <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
                      <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
                      <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in the browser
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange('push')}
                  />
                </div>
                
                <Separator />
                <h3 className="text-sm font-medium pt-2">Notification Categories</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Messages & Mentions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When someone mentions you or sends you a message
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.messages}
                    onCheckedChange={() => handleNotificationChange('messages')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="convention-reminders">Convention Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders about upcoming conventions
                    </p>
                  </div>
                  <Switch 
                    id="convention-reminders" 
                    checked={notifications.conventions}
                    onCheckedChange={() => handleNotificationChange('conventions')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inventory-alerts">Inventory Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about inventory changes
                    </p>
                  </div>
                  <Switch 
                    id="inventory-alerts" 
                    checked={notifications.inventory}
                    onCheckedChange={() => handleNotificationChange('inventory')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-updates">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about new features and updates
                    </p>
                  </div>
                  <Switch 
                    id="app-updates" 
                    checked={notifications.updates}
                    onCheckedChange={() => handleNotificationChange('updates')}
                  />
                </div>
                
                <Button>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid gap-6">
              <TwoFactorAuth />
              
              <Card>
                <CardHeader>
                  <CardTitle>Password Settings</CardTitle>
                  <CardDescription>Update your password or security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  
                  <Button>Update Password</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>Manage your active sessions and devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Device</p>
                        <p className="text-xs text-muted-foreground">Chrome on Windows • Active now</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary rounded px-2 py-1">Current</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Mobile App</p>
                        <p className="text-xs text-muted-foreground">iOS • Last active 2 days ago</p>
                      </div>
                      <Button variant="ghost" size="sm">Sign out</Button>
                    </div>
                    
                    <Button variant="outline" className="w-full">Sign out of all devices</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>Set your language and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Display Language</Label>
                  <select 
                    id="language" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="fr-FR">Français</option>
                    <option value="de-DE">Deutsch</option>
                    <option value="es-ES">Español</option>
                    <option value="ja-JP">日本語</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select 
                    id="date-format" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <select 
                    id="time-format" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="12">12-hour (AM/PM)</option>
                    <option value="24">24-hour</option>
                  </select>
                </div>
                
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
