
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FilterIcon, DownloadIcon } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';

const ConventionLogs = () => {
  const { currentAssociation } = useAssociation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Track all actions and changes during conventions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Convention Activity Logs</CardTitle>
          <CardDescription>
            Records of all actions taken during conventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Logs Available</h3>
            <p className="mt-1 text-muted-foreground">
              Logs will appear here once conventions are active.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionLogs;
