import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownIcon, ArrowUpIcon, Package, AlertCircle, PlusIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionEquipment } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddEquipmentDialog } from '@/components/conventions/AddEquipmentDialog';

const ConventionEquipmentPage = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [equipmentList, setEquipmentList] = useState<ConventionEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_equipment')
        .select(`
          *,
          items:item_id(id, name, barcode, category_id),
          locations:location_id(id, name)
        `)
        .eq('convention_id', conventionId);
      
      if (error) throw error;
      
      setEquipmentList(data || []);
    } catch (error: any) {
      console.error('Error loading equipment:', error);
      toast({
        title: 'Error loading equipment',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEquipment();
  }, [conventionId, currentAssociation]);

  const handleEquipmentAdded = () => {
    fetchEquipment();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'allocated':
        return <Badge variant="outline">Allocated</Badge>;
      case 'issued':
        return <Badge variant="default">Issued</Badge>;
      case 'returned':
        return <Badge variant="secondary">Returned</Badge>;
      case 'damaged':
        return <Badge variant="destructive">Damaged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Count equipment by status
  const statusCounts = {
    total: equipmentList.length,
    allocated: equipmentList.filter(e => e.status === 'allocated').length,
    issued: equipmentList.filter(e => e.status === 'issued').length,
    returned: equipmentList.filter(e => e.status === 'returned').length,
    damaged: equipmentList.filter(e => e.status === 'damaged').length,
  };

  // Update equipment status (issue all allocated equipment)
  const issueEquipment = async () => {
    if (!conventionId) return;
    
    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // Get all allocated equipment
      const allocatedEquipment = equipmentList.filter(e => e.status === 'allocated');
      
      if (allocatedEquipment.length === 0) {
        toast({
          title: "No equipment to issue",
          description: "There is no allocated equipment to issue",
          variant: "warning",
        });
        return;
      }

      // Update all allocated equipment to issued
      const { error } = await supabase
        .from('convention_equipment')
        .update({
          status: 'issued',
          issued_by: user.id,
          issued_at: new Date().toISOString(),
        })
        .eq('convention_id', conventionId)
        .eq('status', 'allocated');

      if (error) throw error;

      toast({
        title: "Equipment issued",
        description: `Successfully issued ${allocatedEquipment.length} items`,
      });

      fetchEquipment();
    } catch (error: any) {
      console.error('Error issuing equipment:', error);
      toast({
        title: 'Error issuing equipment',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Return all issued equipment
  const returnEquipment = async () => {
    if (!conventionId) return;
    
    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // Get all issued equipment
      const issuedEquipment = equipmentList.filter(e => e.status === 'issued');
      
      if (issuedEquipment.length === 0) {
        toast({
          title: "No equipment to return",
          description: "There is no issued equipment to return",
          variant: "warning",
        });
        return;
      }

      // Update all issued equipment to returned
      const { error } = await supabase
        .from('convention_equipment')
        .update({
          status: 'returned',
          returned_by: user.id,
          returned_at: new Date().toISOString(),
        })
        .eq('convention_id', conventionId)
        .eq('status', 'issued');

      if (error) throw error;

      toast({
        title: "Equipment returned",
        description: `Successfully returned ${issuedEquipment.length} items`,
      });

      fetchEquipment();
    } catch (error: any) {
      console.error('Error returning equipment:', error);
      toast({
        title: 'Error returning equipment',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Equipment</h1>
          <p className="text-muted-foreground">Manage equipment for conventions.</p>
        </div>
        <Button onClick={() => setIsAddEquipmentOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
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
            <Button onClick={issueEquipment} disabled={statusCounts.allocated === 0}>
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Issue Equipment ({statusCounts.allocated} items)
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
            <Button variant="outline" onClick={returnEquipment} disabled={statusCounts.issued === 0}>
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Return Equipment ({statusCounts.issued} items)
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status</CardTitle>
          <CardDescription>Current status of all equipment for this convention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading equipment...</p>
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Equipment Assigned</h3>
              <p className="mt-1 text-muted-foreground">
                No equipment has been assigned to this convention yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddEquipmentOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Equipment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentList.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>{equipment.items?.name || 'Unknown Item'}</TableCell>
                    <TableCell>{equipment.quantity}</TableCell>
                    <TableCell>{equipment.locations?.name || 'Not assigned'}</TableCell>
                    <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                    <TableCell className="truncate max-w-xs">
                      {equipment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddEquipmentDialog 
        isOpen={isAddEquipmentOpen} 
        onClose={() => setIsAddEquipmentOpen(false)} 
        conventionId={conventionId || ''} 
        onEquipmentAdded={handleEquipmentAdded}
      />
    </div>
  );
};

export default ConventionEquipmentPage;
