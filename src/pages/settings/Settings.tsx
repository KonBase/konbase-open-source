import { useState, useEffect, useRef } from 'react';
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
  ToggleLeft,
  MessageSquare,
  Accessibility,
  Bug,
  Trash2
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { enableDebugMode, isDebugModeEnabled, logDebug } from '@/utils/debug';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';
import AccessibilitySettings from '@/components/settings/AccessibilitySettings';
import LanguageRegionSettings from '@/components/settings/LanguageRegionSettings';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/utils/languageUtils';
import { useLocation } from 'react-router-dom';

const Settings = () => {
  const { profile, loading, refreshProfile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const componentMountedRef = useRef(false);
  const location = useLocation();
  
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(() => isDebugModeEnabled());
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    conventions: true,
    inventory: true,
    messages: true,
    updates: true
  });
  
  // Force refresh when component mounts to ensure we have the latest data
  useEffect(() => {
    if (!componentMountedRef.current) {
      componentMountedRef.current = true;
      refreshProfile();
      logDebug('Settings component mounted', { path: location.pathname }, 'info');
    }
  }, [refreshProfile, location]);
  
  // Listen for forced refresh events from RouteChangeHandler
  useEffect(() => {
    const handleForceRefresh = (event: CustomEvent) => {
      if (event.detail?.targetSection === 'settings') {
        logDebug('Forced refresh in settings component', null, 'info');
        refreshProfile();
      }
    };
    
    window.addEventListener('force-section-refresh', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('force-section-refresh', handleForceRefresh as EventListener);
    };
  }, [refreshProfile]);
  
  // Listen for route section changes
  useEffect(() => {
    const handleRouteChange = (event: CustomEvent) => {
      const { currentPath } = event.detail;
      
      if (currentPath?.includes('/settings')) {
        logDebug('Route changed to settings', { currentPath }, 'info');
        refreshProfile();
      }
    };
    
    window.addEventListener('route-section-changed', handleRouteChange as EventListener);
    
    return () => {
      window.removeEventListener('route-section-changed', handleRouteChange as EventListener);
    };
  }, [refreshProfile]);

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
      title: newValue ? t("Debug mode enabled") : t("Debug mode disabled"),
      description: newValue 
        ? t("Additional debugging information is now available.") 
        : t("Debug mode has been turned off."),
    });
  };
  
  const saveAccountSettings = async () => {
    setIsFormSaving(true);
    
    try {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t("Settings updated"),
        description: t("Your account settings have been saved successfully."),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("Failed to update settings"),
        description: t("There was a problem saving your settings. Please try again."),
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
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("Settings")}</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'md:grid-cols-6'} mb-4 min-w-max`}>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Account")}</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Appearance")}</span>
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Accessibility")}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Notifications")}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Security")}</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Language")}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("Account Settings")}
                </CardTitle>
                <CardDescription>{t("Manage your account information")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Name")}</Label>
                  <Input id="name" defaultValue={profile?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ''} />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debug-mode" className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        {t("Debug Mode")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("Show additional debugging information")}
                      </p>
                    </div>
                    <Switch 
                      id="debug-mode" 
                      checked={isDebugMode} 
                      onCheckedChange={handleDebugModeToggle} 
                    />
                  </div>
                  
                  {isDebugMode && (
                    <div className="bg-muted p-3 rounded-md border border-border/50 space-y-2">
                      <h4 className="text-sm font-medium">{t("Debug Options")}</h4>
                      <p className="text-xs text-muted-foreground">{t("Debug mode provides additional information that can help troubleshoot issues with the application.")}</p>
                      
                      <div className="flex justify-between gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setIsDebugMode(false);
                            enableDebugMode(false);
                            toast({
                              title: t("Debug mode disabled"),
                              description: t("Debug mode has been turned off."),
                            });
                            // Reload the page to ensure all components respect the new setting
                            setTimeout(() => window.location.reload(), 500);
                          }}
                        >
                          <ToggleLeft className="h-3 w-3 mr-1" />
                          {t("Disable & Reload")}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            // Clear all debug logs
                            localStorage.removeItem('konbase_debug_logs');
                            toast({
                              title: t("Debug logs cleared"),
                              description: t("All debug logs have been cleared."),
                            });
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t("Clear Debug Logs")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">{t("Marketing emails")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive emails about new features and updates")}
                    </p>
                  </div>
                  <Switch id="marketing" defaultChecked={true} />
                </div>
                
                <Button 
                  onClick={saveAccountSettings} 
                  disabled={isFormSaving}
                  className={isMobile ? "w-full" : ""}
                >
                  {isFormSaving ? t('Saving...') : t('Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  {t("Appearance")}
                </CardTitle>
                <CardDescription>{t("Customize the look and feel of the application")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="mb-2 text-lg font-medium">{t("Theme")}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("Light")}</span>
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("Dark")}</span>
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('system')}
                    >
                      <Laptop className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("System")}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accessibility">
            <AccessibilitySettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t("Notification Settings")}
                </CardTitle>
                <CardDescription>{t("Configure how you receive notifications")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">{t("Email Notifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications via email")}
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
                    <Label htmlFor="push-notifications">{t("Push Notifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications in the browser")}
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange('push')}
                  />
                </div>
                
                <Separator />
                <h3 className="text-sm font-medium pt-2">{t("Notification Categories")}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("Messages & Mentions")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("When someone mentions you or sends you a message")}
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.messages}
                    onCheckedChange={() => handleNotificationChange('messages')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="convention-reminders">{t("Convention Reminders")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Get reminders about upcoming conventions")}
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
                    <Label htmlFor="inventory-alerts">{t("Inventory Alerts")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Get notified about inventory changes")}
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
                    <Label htmlFor="app-updates">{t("Product Updates")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications about new features and updates")}
                    </p>
                  </div>
                  <Switch 
                    id="app-updates" 
                    checked={notifications.updates}
                    onCheckedChange={() => handleNotificationChange('updates')}
                  />
                </div>
                
                <Button className={isMobile ? "w-full" : ""}>
                  {t("Save Notification Settings")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid gap-4 md:gap-6">
              <TwoFactorAuth />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t("Password Settings")}
                  </CardTitle>
                  <CardDescription>{t("Update your password or security preferences")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("Current Password")}</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("New Password")}</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("Confirm New Password")}</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  
                  <Button className={isMobile ? "w-full" : ""}>
                    {t("Update Password")}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Laptop className="h-5 w-5" />
                    {t("Sessions")}
                  </CardTitle>
                  <CardDescription>{t("Manage your active sessions and devices")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t("Current Device")}</p>
                        <p className="text-xs text-muted-foreground">{t("Chrome on Windows • Active now")}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary rounded px-2 py-1">{t("Current")}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t("Mobile App")}</p>
                        <p className="text-xs text-muted-foreground">{t("iOS • Last active 2 days ago")}</p>
                      </div>
                      <Button variant="ghost" size="sm">{t("Sign out")}</Button>
                    </div>
                    
                    <Button variant="outline" className="w-full">{t("Sign out of all devices")}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="language">
            <LanguageRegionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
