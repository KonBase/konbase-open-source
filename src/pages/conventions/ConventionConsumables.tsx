import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, PlusIcon, Pencil, ShoppingCart, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionConsumable } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AddConsumableDialog } from '@/components/conventions/AddConsumableDialog';
import { UpdateConsumableUsageDialog } from '@/components/conventions/UpdateConsumableUsageDialog';

const ConventionConsumables = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [consumables, setConsumables] = useState<ConventionConsumable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddConsumableOpen, setIsAddConsumableOpen] = useState(false);
  const [isUpdateUsageOpen, setIsUpdateUsageOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<ConventionConsumable | null>(null);
  const { toast } = useToast();

  const fetchConsumables = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_consumables')
        .select(`
          *,
          items:item_id(id, name, barcode, category_id),
          locations:location_id(id, name)
        `)
        .eq('convention_id', conventionId);
      
      if (error) throw error;
      
      setConsumables(data || []);
    } catch (error: any) {
      console.error('Error loading consumables:', error);
      toast({
        title: 'Error loading consumables',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConsumables();
  }, [conventionId, currentAssociation]);

  const handleConsumableAdded = () => {
    fetchConsumables();
  };

  const handleUsageUpdated = () => {
    fetchConsumables();
  };
  
  const openUpdateUsageDialog = (consumable: ConventionConsumable) => {
    setSelectedConsumable(consumable);
    setIsUpdateUsageOpen(true);
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min(Math.round((used / allocated) * 100), 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumables Tracking</h1>
          <p className="text-muted-foreground">Track usage of consumable items during conventions.</p>
        </div>
        <Button onClick={() => setIsAddConsumableOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Consumable
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>Overview of consumable inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Consumable Types</span>
                <span className="font-medium">{consumables.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Items Allocated</span>
                <span className="font-medium">
                  {consumables.reduce((sum, item) => sum + item.allocated_quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Items Used</span>
                <span className="font-medium">
                  {consumables.reduce((sum, item) => sum + item.used_quantity, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage consumable inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="justify-start" onClick={() => setIsAddConsumableOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Allocate More Consumables
              </Button>
              <Button variant="outline" className="justify-start">
                <BarChart className="mr-2 h-4 w-4" />
                View Usage Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Consumables List</CardTitle>
          <CardDescription>All consumable items for this convention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading consumables...</p>
            </div>
          ) : consumables.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Consumables Assigned</h3>
              <p className="mt-1 text-muted-foreground">
                No consumable items have been assigned to this convention yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddConsumableOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Consumable
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumables.map((consumable) => (
                  <TableRow key={consumable.id}>
                    <TableCell className="font-medium">{consumable.items?.name || 'Unknown Item'}</TableCell>
                    <TableCell>{consumable.locations?.name || 'Not assigned'}</TableCell>
                    <TableCell>{consumable.allocated_quantity}</TableCell>
                    <TableCell>{consumable.used_quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={getUsagePercentage(consumable.used_quantity, consumable.allocated_quantity)} 
                          className="h-2 w-24" 
                        />
                        <span className="text-xs">
                          {getUsagePercentage(consumable.used_quantity, consumable.allocated_quantity)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openUpdateUsageDialog(consumable)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddConsumableDialog 
        isOpen={isAddConsumableOpen} 
        onClose={() => setIsAddConsumableOpen(false)} 
        conventionId={conventionId || ''} 
        onConsumableAdded={handleConsumableAdded}
      />

      {selectedConsumable && (
        <UpdateConsumableUsageDialog
          isOpen={isUpdateUsageOpen}
          onClose={() => setIsUpdateUsageOpen(false)}
          consumable={selectedConsumable}
          onUsageUpdated={handleUsageUpdated}
        />
      )}
    </div>
  );
};

export default ConventionConsumables;
