
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Search } from 'lucide-react';

// Interface for user profiles
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { profile } = useUserProfile();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and system settings
        </p>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts and permissions
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between p-2 border-b animate-pulse">
                      <div className="space-y-1">
                        <div className="h-4 w-40 bg-muted rounded"></div>
                        <div className="h-3 w-60 bg-muted rounded"></div>
                      </div>
                      <div className="h-8 w-32 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-4">No users found</p>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col md:flex-row justify-between md:items-center p-2 border-b last:border-0 gap-2">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          User ID: {user.id.substring(0, 8)}... | Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <UserRoleManager
                        userId={user.id}
                        currentRole={user.role as any}
                        onRoleUpdated={fetchUsers}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 opacity-70 pointer-events-none">
                <div className="space-y-2">
                  <h3 className="font-medium">Registration Settings</h3>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="allow-registration" checked disabled />
                    <label htmlFor="allow-registration">Allow new user registrations</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="email-verification" checked disabled />
                    <label htmlFor="email-verification">Require email verification</label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Security Settings</h3>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="enforce-2fa" disabled />
                    <label htmlFor="enforce-2fa">Enforce 2FA for all admin users</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="session-timeout" checked disabled />
                    <label htmlFor="session-timeout">Enable session timeout (60 minutes)</label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/40 rounded-md">
                <p className="text-center text-muted-foreground">
                  System settings functionality will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Review system activity and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/40 rounded-md">
                <p className="text-center text-muted-foreground">
                  Audit logging functionality will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
