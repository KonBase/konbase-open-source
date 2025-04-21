import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MapIcon, BuildingIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionLocation } from '@/types/convention';
import { AddLocationDialog } from '@/components/conventions/AddLocationDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const ConventionLocations = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [locations, setLocations] = useState<ConventionLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const { toast } = useToast();

  const fetchLocations = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_locations')
        .select('*')
        .eq('convention_id', conventionId)
        .order('name');
      
      if (error) throw error;
      
      setLocations(data || []);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      toast({
        title: 'Error loading locations',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLocations();
  }, [conventionId, currentAssociation]);

  const handleLocationAdded = () => {
    fetchLocations();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Locations</h1>
          <p className="text-muted-foreground">Manage rooms and locations for conventions.</p>
        </div>
        <Button onClick={() => setIsAddLocationOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>Visual overview of convention locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-8 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapIcon className="mx-auto h-12 w-12 mb-4" />
              <p>Location map feature coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>Rooms and areas for this convention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading locations...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-10">
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Locations Added</h3>
              <p className="mt-1 text-muted-foreground">
                No locations have been added to this convention yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddLocationOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Location
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.type}</TableCell>
                    <TableCell>{location.capacity || 'N/A'}</TableCell>
                    <TableCell>{location.building || 'N/A'}</TableCell>
                    <TableCell>{location.floor || 'N/A'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddLocationDialog 
        isOpen={isAddLocationOpen} 
        onClose={() => setIsAddLocationOpen(false)} 
        conventionId={conventionId || ''} 
        onLocationAdded={handleLocationAdded}
      />
    </div>
  );
};

export default ConventionLocations;
