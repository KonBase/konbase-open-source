
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, PlusIcon, MinusIcon } from 'lucide-react';

const ConventionConsumables = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumables Tracking</h1>
          <p className="text-muted-foreground">Track usage of consumable items during conventions.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocate Consumables</CardTitle>
            <CardDescription>Assign consumables to a convention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Allocate consumable items to a specific convention.
            </p>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Allocate Consumables
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Record Usage</CardTitle>
            <CardDescription>Record consumption of items</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Track how many consumable items have been used.
            </p>
            <Button variant="outline">
              <MinusIcon className="mr-2 h-4 w-4" />
              Record Usage
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Consumables Status</CardTitle>
          <CardDescription>Current status of all consumable items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Consumables Tracking Coming Soon</h3>
            <p className="mt-1 text-muted-foreground">
              This feature is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionConsumables;
