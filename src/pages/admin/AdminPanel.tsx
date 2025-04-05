
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { useEffect, useState } from 'react';

const AdminPanel = () => {
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('users');
  
  // Check for any tab parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'associations', 'system', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, associations, and system settings
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="associations">Association Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        {/* Associations Tab */}
        <TabsContent value="associations">
          <AssociationManagement />
        </TabsContent>
        
        {/* System Settings Tab */}
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
        
        {/* Audit Logs Tab */}
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
      </Tabs>
    </div>
  );
};

export default AdminPanel;
