import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import { useAssociation } from '@/contexts/AssociationContext';
import MemberManager from '@/components/association/MemberManager';

const Dashboard = () => {
  const { currentAssociation } = useAssociation();
  const someNumberValue = 42; // Example number value

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
                {/* Association info will go here */}
                <p className="text-sm text-muted-foreground">Manage your association details, members and equipment</p>
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
                {/* Recent activity list will go here */}
                <p className="text-sm text-muted-foreground">No recent activities to display</p>
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
                <p className="text-sm text-muted-foreground">Example number as string: {someNumberValue.toString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <ConventionManagementSection something={[]} />
        
        {/* Association Members Section */}
        <div className="py-6">
          <MemberManager minimal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
