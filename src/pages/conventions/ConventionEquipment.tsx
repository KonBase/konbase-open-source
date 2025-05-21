import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownIcon, ArrowUpIcon, Package, AlertCircle, PlusIcon, CheckCircle, Truck, Warehouse, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionEquipment } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddEquipmentDialog } from '@/components/conventions/AddEquipmentDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ConventionEquipmentPage = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [equipmentList, setEquipmentList] = useState<ConventionEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const { toast } = useToast();
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isIssuingStored, setIsIssuingStored] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [filteredStoredEquipment, setFilteredStoredEquipment] = useState<ConventionEquipment[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchEquipment = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_equipment')
        .select(`
          *,
          items:item_id(id, name, barcode, category_id),
          locations:convention_location_id(id, name)
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
      case 'stored':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300"><Warehouse className="mr-1 h-3 w-3" /> Stored</Badge>;
      case 'issued':
        return <Badge variant="default"><Truck className="mr-1 h-3 w-3" /> Issued</Badge>;
      case 'returned':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Returned</Badge>;
      case 'damaged':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Damaged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Count equipment by status
  const statusCounts = {
    total: equipmentList.length,
    allocated: equipmentList.filter(e => e.status === 'allocated').length,
    stored: equipmentList.filter(e => e.status === 'stored').length,
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

  // Pobierz dostępne lokalizacje dla konwencji
  const fetchLocations = async () => {
    if (!conventionId) return;
    const { data, error } = await supabase
      .from('convention_locations')
      .select('id, name')
      .eq('convention_id', conventionId);
    if (!error && data) setLocations(data);
  };

  // Pobierz użytkowników do wyboru kto pobiera sprzęt (tylko organizatorzy i helperzy tej konwencji)
  const fetchUsers = async () => {
    if (!conventionId) return;
    // Pobierz powiązania userów z konwencją jako organizator lub helper
    const { data, error } = await supabase
      .from('convention_access')
      .select('user_id, profiles(name), role')
      .eq('convention_id', conventionId)
      .in('role', ['organizer', 'helper']);
    if (!error && data) {
      setUsers(
        data
          .filter((row: any) => row.profiles)
          .map((row: any) => ({
            id: row.user_id, // poprawka tutaj
            full_name: row.profiles.name,
          }))
      );
    }
  };

  useEffect(() => {
    if (isLocationDialogOpen) {
      fetchLocations();
      fetchUsers();
      // Filtruj sprzęt w statusie 'stored'
      setFilteredStoredEquipment(equipmentList.filter(e => e.status === 'stored'));
    }
  }, [isLocationDialogOpen, equipmentList]);

  // Wydanie wybranego sprzętu ze statusem "stored" do wybranej lokalizacji i osoby
  const issueStoredEquipment = async () => {
    if (!conventionId || !selectedLocationId || !selectedEquipmentId || !selectedUserId) return;
    setIsIssuingStored(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('convention_equipment')
        .update({
          status: 'issued',
          assigned_by: selectedUserId,
          assigned_at: new Date().toISOString(),
          convention_location_id: selectedLocationId,
        })
        .eq('convention_id', conventionId)
        .eq('id', selectedEquipmentId)
        .eq('status', 'stored');

      if (error) throw error;

      toast({
        title: "Sprzęt wydany",
        description: `Sprzęt został wydany do wybranej lokalizacji.`,
      });

      setIsLocationDialogOpen(false);
      setSelectedLocationId(null);
      setSelectedEquipmentId(null);
      setSelectedUserId(null);
      fetchEquipment();
    } catch (error: any) {
      toast({
        title: 'Błąd wydania sprzętu',
        description: error.message || 'Wystąpił nieznany błąd',
        variant: 'destructive',
      });
    } finally {
      setIsIssuingStored(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convention Equipment</h1>
          <p className="text-muted-foreground">
            Manage equipment allocation, issuance, and returns for this convention.
          </p>
          {/* Link back to convention details */}
          <Button variant="link" asChild className="p-0 h-auto text-sm">
            <RouterLink to={`/conventions/${conventionId}`}>Back to Convention Details</RouterLink>
          </Button>
        </div>
        <Button onClick={() => setIsAddEquipmentOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUpIcon className="h-5 w-5" /> Issue Equipment</CardTitle>
            <CardDescription>Move allocated equipment to 'Issued' status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Marks equipment as actively in use at the convention.
              Requires {statusCounts.allocated} item(s) in 'Allocated' status.
            </p>
            <Button onClick={issueEquipment} disabled={statusCounts.allocated === 0} className="w-full sm:w-auto">
              <Truck className="mr-2 h-4 w-4" />
              Issue All Allocated ({statusCounts.allocated})
            </Button>
            <Button
              onClick={() => setIsLocationDialogOpen(true)}
              disabled={statusCounts.stored === 0}
              className="w-full sm:w-auto mt-2"
            >
              <Truck className="mr-2 h-4 w-4" />
              Issue Stored ({statusCounts.stored})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDownIcon className="h-5 w-5" /> Return Equipment</CardTitle>
            <CardDescription>Move issued equipment back to 'Returned' status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Marks equipment as returned from the convention.
              Requires {statusCounts.issued} item(s) in 'Issued' status.
            </p>
            <Button variant="outline" onClick={returnEquipment} disabled={statusCounts.issued === 0} className="w-full sm:w-auto">
              <Warehouse className="mr-2 h-4 w-4" />
              Return All Issued ({statusCounts.issued})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status List</CardTitle>
          <CardDescription>Current status of all equipment assigned to this convention.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading equipment...</span>
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Equipment Assigned</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign equipment to this convention to track its status.
              </p>
              <Button variant="default" className="mt-4" onClick={() => setIsAddEquipmentOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Equipment Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Assigned Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    {/* <TableHead>Actions</TableHead> */} {/* Add actions later if needed */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentList.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell className="font-medium">{equipment.items?.name || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{equipment.items?.barcode || '-'}</TableCell>
                      <TableCell className="text-right">{equipment.quantity}</TableCell>
                      <TableCell>{equipment.locations?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={equipment.notes || ''}>
                        {equipment.notes || '-'}
                      </TableCell>
                      {/* <TableCell><Button variant="ghost" size="sm">Edit</Button></TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <AddEquipmentDialog
        isOpen={isAddEquipmentOpen}
        onClose={() => setIsAddEquipmentOpen(false)}
        conventionId={conventionId || ''}
        onEquipmentAdded={handleEquipmentAdded}
      />

      {/* Dialog wyboru lokalizacji, sprzętu i osoby dla "Issue Stored" */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wydaj sprzęt ze stanu magazynowego</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lokalizacja */}
            <Select
              value={selectedLocationId || ''}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz lokalizację" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Sprzęt */}
            <Select
              value={selectedEquipmentId || ''}
              onValueChange={setSelectedEquipmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz sprzęt (nazwa lub barcode)" />
              </SelectTrigger>
              <SelectContent>
                {filteredStoredEquipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.items?.name || 'N/A'} {eq.items?.barcode ? `(${eq.items.barcode})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Osoba pobierająca */}
            <Select
              value={selectedUserId || ''}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kto pobiera?" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={issueStoredEquipment}
              disabled={!selectedLocationId || !selectedEquipmentId || !selectedUserId || isIssuingStored}
            >
              {isIssuingStored ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
              Wydaj do lokalizacji
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConventionEquipmentPage;
