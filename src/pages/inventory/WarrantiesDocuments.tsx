import React from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DocumentManager from '@/components/inventory/DocumentManager';

const WarrantiesDocuments = () => {
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
            <p className="mb-4">To get started with documents and warranties, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup/association">Set Up Association</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Warranties & Documents</h1>
          <p className="text-muted-foreground">Manage warranties, manuals, and documents for your equipment.</p>
        </div>
      </div>
      
      <DocumentManager />
    </div>
  );
};

export default WarrantiesDocuments;
