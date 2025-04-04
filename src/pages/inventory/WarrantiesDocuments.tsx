
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileWarning, PlusIcon } from 'lucide-react';

const WarrantiesDocuments = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warranties & Documents</h1>
          <p className="text-muted-foreground">Manage warranties, manuals, and documents for your equipment.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Document Management Coming Soon</h3>
            <p className="mt-1 text-muted-foreground">
              This feature is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantiesDocuments;
