
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusIcon, CheckIcon, XIcon } from 'lucide-react';

const ConventionRequirements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requirements Management</h1>
          <p className="text-muted-foreground">Track and fulfill equipment requirements for conventions.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20 pb-2">
            <CardTitle className="flex justify-between">
              <span>Requested</span>
              <span className="text-yellow-600 dark:text-yellow-400">3</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Requirements</h3>
              <p className="mt-1 text-muted-foreground">
                No requested requirements found.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-2">
            <CardTitle className="flex justify-between">
              <span>Approved</span>
              <span className="text-blue-600 dark:text-blue-400">0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-10">
              <CheckIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Approvals</h3>
              <p className="mt-1 text-muted-foreground">
                No approved requirements found.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-950/20 pb-2">
            <CardTitle className="flex justify-between">
              <span>Denied</span>
              <span className="text-red-600 dark:text-red-400">0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-10">
              <XIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Denials</h3>
              <p className="mt-1 text-muted-foreground">
                No denied requirements found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Requirements</CardTitle>
          <CardDescription>Complete list of all requirements for conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Requirements Yet</h3>
            <p className="mt-1 text-muted-foreground">
              Create your first requirement to get started.
            </p>
            <Button className="mt-4">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Requirement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionRequirements;
