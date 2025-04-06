
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import { useAssociation } from '@/contexts/AssociationContext';
import MemberManager from '@/components/association/MemberManager';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

const Dashboard = () => {
  const { currentAssociation } = useAssociation();
  
  // Use the enhanced query hook to efficiently fetch additional data
  const { data: recentActivity, isLoading: isLoadingActivity } = useSupabaseQuery<AuditLog[]>(
    ['recent-activity', currentAssociation?.id],
    async () => {
      if (!currentAssociation?.id) return { data: [], error: null };
      // Example query - adjust based on your schema
      return await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'associations')
        .eq('entity_id', currentAssociation.id)
        .order('created_at', { ascending: false })
        .limit(5);
    },
    {
      enabled: !!currentAssociation?.id,
      staleTime: 30000 // Cache data for 30 seconds
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to {currentAssociation?.name || 'KonBase'}
          </p>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-10">
          <Card>
            <CardHeader>
              <CardTitle>Association Overview</CardTitle>
              <CardDescription>Current status of your association</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAssociation ? (
                  <>
                    <p><span className="font-medium">Name:</span> {currentAssociation.name}</p>
                    <p><span className="font-medium">Email:</span> {currentAssociation.contactEmail || 'Not provided'}</p>
                    {currentAssociation.description && (
                      <p><span className="font-medium">Description:</span> {currentAssociation.description}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Manage your association details, members and equipment</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingActivity ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <ul className="space-y-2">
                    {recentActivity.map((activity: AuditLog) => (
                      <li key={activity.id} className="text-sm">
                        <span className="font-medium">{activity.action}</span>: {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Unknown time'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activities to display</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for fast access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick action buttons will go here */}
                <p className="text-sm text-muted-foreground">Access your most common tasks quickly</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <ConventionManagementSection />
        
        {/* Association Members Section */}
        <div className="py-6">
          <MemberManager minimal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
