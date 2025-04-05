
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminElevationButton } from '@/components/admin/SuperAdminElevationButton';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const { hasRole } = useAuth();
  
  // Determine if the user has access to specific admin sections
  const canAccessSettings = hasRole('super_admin');
  const canAccessAuditLogs = hasRole('super_admin');
  const isSystemAdmin = hasRole('system_admin') && !hasRole('super_admin');
  
  return (
    <RoleGuard allowedRoles={['admin', 'system_admin', 'super_admin']}>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, associations, and system settings
            </p>
          </div>
          
          {/* Show elevation button for system_admin users */}
          {isSystemAdmin && <SuperAdminElevationButton />}
        </div>
        
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="associations">Associations</TabsTrigger>
              
              {/* Only show these tabs to super_admin */}
              {canAccessAuditLogs && <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>}
              {canAccessSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="associations" className="space-y-4">
              <AssociationManagement />
            </TabsContent>
            
            {canAccessAuditLogs && (
              <TabsContent value="audit-logs" className="space-y-4">
                <AuditLogViewer />
              </TabsContent>
            )}
            
            {canAccessSettings && (
              <TabsContent value="settings" className="space-y-4">
                <SystemSettings />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </RoleGuard>
  );
}
