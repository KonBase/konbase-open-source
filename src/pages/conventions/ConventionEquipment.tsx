
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownIcon, ArrowUpIcon, Package } from 'lucide-react';

const ConventionEquipment = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Equipment</h1>
          <p className="text-muted-foreground">Manage equipment for conventions.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issue Equipment</CardTitle>
            <CardDescription>Assign equipment to a convention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Move equipment from storage to convention locations.
            </p>
            <Button>
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Issue Equipment
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Return Equipment</CardTitle>
            <CardDescription>Return equipment from a convention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Move equipment from convention locations back to storage.
            </p>
            <Button variant="outline">
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Return Equipment
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status</CardTitle>
          <CardDescription>Current status of all equipment for conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Equipment Tracking Coming Soon</h3>
            <p className="mt-1 text-muted-foreground">
              This feature is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionEquipment;
