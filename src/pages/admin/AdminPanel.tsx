import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/contexts/auth';
import { SuperAdminElevationButton } from '@/components/admin/SuperAdminElevationButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuth(); // Removed hasRole
  const { toast } = useToast();
  
  // Determine if the user has access to specific admin sections
  const canAccessSettings = user?.role === 'super_admin';
  const canAccessAuditLogs = user?.role === 'super_admin';
  const isSystemAdmin = user?.role === 'system_admin';
  
  // Effect to check for elevation success on page load (useful after page refreshes)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const elevationSuccess = urlParams.get('elevation');
    
    if (elevationSuccess === 'success') {
      toast({
        title: 'Super Admin Access Granted',
        description: 'You now have super admin privileges',
        variant: 'default',
      });
      
      // Remove the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);
  
  return (
    <RoleGuard allowedRoles={['system_admin', 'super_admin']}>
      <div className="container mx-auto py-4 md:py-8 px-2 md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, associations, and system settings
            </p>
          </div>
          
          {/* Show elevation button for system_admin users */}
          {isSystemAdmin && <SuperAdminElevationButton />}
        </div>
        
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="flex w-full justify-start overflow-x-auto px-2 py-1">
                <TabsTrigger value="users" className="flex-shrink-0">Users</TabsTrigger>
                <TabsTrigger value="associations" className="flex-shrink-0">Associations</TabsTrigger>
                
                {/* Only show these tabs to super_admin */}
                {canAccessAuditLogs && <TabsTrigger value="audit-logs" className="flex-shrink-0">Audit Logs</TabsTrigger>}
                {canAccessSettings && <TabsTrigger value="settings" className="flex-shrink-0">Settings</TabsTrigger>}
              </TabsList>
            </ScrollArea>
            
            <TabsContent value="users" className="space-y-4 px-2 md:px-4 pt-4">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="associations" className="space-y-4 px-2 md:px-4 pt-4">
              <AssociationManagement />
            </TabsContent>
            
            {canAccessAuditLogs && (
              <TabsContent value="audit-logs" className="space-y-4 px-2 md:px-4 pt-4">
                <AuditLogViewer />
              </TabsContent>
            )}
            
            {canAccessSettings && (
              <TabsContent value="settings" className="space-y-4 px-2 md:px-4 pt-4">
                <SystemSettings />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </RoleGuard>
  );
}
