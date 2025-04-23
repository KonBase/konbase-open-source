import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MapIcon, BuildingIcon, Edit, Loader2, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionLocation } from '@/types/convention';
import { AddLocationDialog } from '@/components/conventions/AddLocationDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convention Locations</h1>
          <p className="text-muted-foreground">Manage specific rooms, areas, or venues for this convention.</p>
          {/* Link back to convention details */}
          <Button variant="link" asChild className="p-0 h-auto text-sm">
            <RouterLink to={`/conventions/${conventionId}`}>Back to Convention Details</RouterLink>
          </Button>
        </div>
        <Button onClick={() => setIsAddLocationOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Placeholder for Map - kept simple */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapIcon className="h-5 w-5" /> Location Map</CardTitle>
          <CardDescription>Visual overview of convention locations (Feature coming soon).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-8 flex items-center justify-center bg-muted/40">
            <div className="text-center text-muted-foreground">
              <MapIcon className="mx-auto h-10 w-10 mb-2" />
              <p className="text-sm">Location map feature is planned for a future update.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations List Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Defined Locations</CardTitle>
          <CardDescription>List of rooms, halls, and areas defined for this convention.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading locations...</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-10">
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Locations Added Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Define specific locations used during the convention.
              </p>
              <Button variant="default" className="mt-4" onClick={() => setIsAddLocationOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Location
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{location.type || '-'}</TableCell>
                      <TableCell className="text-right">{location.capacity ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{location.building || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{location.floor || '-'}</TableCell>
                      <TableCell className="text-right">
                        {/* TODO: Implement Edit Location Dialog/Functionality */}
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="mr-1 h-3 w-3" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Location Dialog */}
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
