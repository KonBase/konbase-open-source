
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

const AdminPanel = () => {
  const { profile } = useUserProfile();
  const { hasRole, elevateToSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isElevating, setIsElevating] = useState(false);
  
  // Check for any tab parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'associations', 'system', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  const isSystemAdmin = profile?.role === 'system_admin';
  const isSuperAdmin = hasRole('super_admin');
  
  const handleElevateSuperAdmin = async () => {
    setIsElevating(true);
    try {
      const result = await elevateToSuperAdmin();
      
      if (result.success) {
        toast({
          title: "Super Admin Access Granted",
          description: "You now have Super Admin privileges.",
        });
      } else {
        toast({
          title: "Access Denied",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to elevate privileges. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsElevating(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, associations, and system settings
        </p>
      </div>
      
      {isSystemAdmin && !isSuperAdmin && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              System Admin Access
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-400">
              You currently have limited access. To access Super Admin features, you need to enable Two-Factor Authentication and elevate your privileges.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={handleElevateSuperAdmin} 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              disabled={isElevating || !profile?.two_factor_enabled}
            >
              {isElevating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Elevating Privileges...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  {profile?.two_factor_enabled 
                    ? "Elevate to Super Admin" 
                    : "Enable 2FA in Settings First"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="associations">Association Management</TabsTrigger>
          
          {/* Only show System Settings for super_admin */}
          {isSuperAdmin && (
            <TabsTrigger value="system">System Settings</TabsTrigger>
          )}
          
          {/* Only show Audit Logs for super_admin */}
          {isSuperAdmin && (
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          )}
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        {/* Associations Tab */}
        <TabsContent value="associations">
          <AssociationManagement />
        </TabsContent>
        
        {/* System Settings Tab - only for super_admin */}
        {isSuperAdmin && (
          <TabsContent value="system">
            <div className="card">
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure global system settings and defaults
                </p>
              </div>
              <div className="p-6">
                <SystemSettings />
              </div>
            </div>
          </TabsContent>
        )}
        
        {/* Audit Logs Tab - only for super_admin */}
        {isSuperAdmin && (
          <TabsContent value="audit">
            <div className="card">
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Audit Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Review system activity and user actions
                </p>
              </div>
              <div className="p-6">
                <AuditLogViewer />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminPanel;
