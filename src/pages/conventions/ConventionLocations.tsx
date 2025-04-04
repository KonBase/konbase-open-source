
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, PlusIcon } from 'lucide-react';

const ConventionLocations = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Locations</h1>
          <p className="text-muted-foreground">Manage rooms and locations for conventions.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>Visual map of all convention locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Location Mapping Coming Soon</h3>
            <p className="mt-1 text-muted-foreground">
              This feature is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Locations List</CardTitle>
          <CardDescription>All locations for conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No convention locations have been defined yet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionLocations;
