
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, PlusIcon } from 'lucide-react';

const ConventionTemplates = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Templates</h1>
          <p className="text-muted-foreground">Create and manage templates for quick convention setup.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>Templates for conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Templates Yet</h3>
            <p className="mt-1 text-muted-foreground">
              Create your first template to save time setting up conventions.
            </p>
            <Button className="mt-4">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
          <CardDescription>How to use templates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Templates allow you to quickly set up new conventions with predefined:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li className="text-muted-foreground">Equipment sets and requirements</li>
            <li className="text-muted-foreground">Location maps</li>
            <li className="text-muted-foreground">Staff roles and assignments</li>
            <li className="text-muted-foreground">Consumable allocations</li>
          </ul>
          <p className="text-muted-foreground">
            Create a template once and use it for all similar conventions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionTemplates;
