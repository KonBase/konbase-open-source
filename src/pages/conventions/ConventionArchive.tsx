
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';

const ConventionArchive = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Archive</h1>
          <p className="text-muted-foreground">Access and manage past conventions.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Archived Conventions</CardTitle>
          <CardDescription>Browse all completed conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Archived Conventions</h3>
            <p className="mt-1 text-muted-foreground">
              Completed conventions will appear here after they are archived.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Archive Management</CardTitle>
          <CardDescription>Tools for managing convention archives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-md font-medium mb-2">Archive a Convention</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Move a completed convention to the archive.
              </p>
              <Button variant="outline">Archive Convention</Button>
            </div>
            <div>
              <h3 className="text-md font-medium mb-2">Export Archive Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Export data from archived conventions for reporting.
              </p>
              <Button variant="outline">Export Archive</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionArchive;
