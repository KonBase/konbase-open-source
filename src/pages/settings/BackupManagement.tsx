
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArchiveIcon, DownloadIcon } from 'lucide-react';

const BackupManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup Management</h1>
          <p className="text-muted-foreground">Manage backups of your association data.</p>
        </div>
        <Button>
          <ArchiveIcon className="mr-2 h-4 w-4" />
          Create New Backup
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Local Backups</CardTitle>
          <CardDescription>Download backups to your local device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download Full Backup
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>History of all created backups.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <ArchiveIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Backups Yet</h3>
            <p className="mt-1 text-muted-foreground">
              Create your first backup to ensure your data is safe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManagement;
