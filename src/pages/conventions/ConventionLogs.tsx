
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, SearchIcon, DownloadIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ConventionLogs = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Comprehensive logs of all convention activities.</p>
        </div>
        <Button variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full" 
                prefix={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <Button variant="secondary">Search</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>All activities recorded for conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Logs Yet</h3>
            <p className="mt-1 text-muted-foreground">
              Activity logs will appear here as events occur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionLogs;
