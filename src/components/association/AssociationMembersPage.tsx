
import React from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MemberManager from './MemberManager';

const AssociationMembersPage = () => {
  const { currentAssociation } = useAssociation();

  if (!currentAssociation) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Association Found</CardTitle>
            <CardDescription>You need to set up your association first</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with EventNexus, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup">Set Up Association</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Association Members</h1>
          <p className="text-muted-foreground">Manage members and permissions for {currentAssociation.name}.</p>
        </div>
      </div>
      
      <MemberManager />
    </div>
  );
};

export default AssociationMembersPage;
