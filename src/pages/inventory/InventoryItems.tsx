
import React, { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash, 
  Package, 
  Filter, 
  X, 
  ArrowUpDown 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';

// Interface for Item type
interface Item {
  id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  barcode: string | null;
  condition: string;
  category_id: string;
  location_id: string;
  association_id: string;
  is_consumable: boolean;
  quantity: number | null;
  minimum_quantity: number | null;
  image: string | null;
  notes: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiration: string | null;
  created_at: string;
  updated_at: string;
}

const InventoryItems = () => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const { categories } = useCategories();
  const { locations } = useLocations();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    barcode: '',
    condition: 'good',
    category_id: '',
    location_id: '',
    is_consumable: false,
    quantity: 1,
    minimum_quantity: null as number | null,
    purchase_date: '',
    purchase_price: null as number | null,
    warranty_expiration: '',
    notes: ''
  });
  
  useEffect(() => {
    if (currentAssociation) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [currentAssociation, filterCategory, filterLocation, filterCondition, sortField, sortDirection]);
  
  const fetchItems = async () => {
    if (!currentAssociation) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('association_id', currentAssociation.id);
      
      // Apply filters
      if (filterCategory) {
        query = query.eq('category_id', filterCategory);
      }
      
      if (filterLocation) {
        query = query.eq('location_id', filterLocation);
      }
      
      if (filterCondition) {
        query = query.eq('condition', filterCondition);
      }
      
      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Apply search filter client-side (for more flexible searching)
      let filteredData = data as Item[];
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.name.toLowerCase().includes(searchLower) || 
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
          (item.barcode && item.barcode.toLowerCase().includes(searchLower))
        );
      }
      
      setItems(filteredData);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleAddItem = async () => {
    if (!currentAssociation) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          ...formData,
          association_id: currentAssociation.id,
          quantity: formData.is_consumable ? formData.quantity : 1,
          minimum_quantity: formData.is_consumable ? formData.minimum_quantity : null,
          purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Item added successfully.',
      });
      
      setIsAddDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleEditItem = async () => {
    if (!currentItem) return;
    
    try {
      const { error } = await supabase
        .from('items')
        .update({
          ...formData,
          quantity: formData.is_consumable ? formData.quantity : 1,
          minimum_quantity: formData.is_consumable ? formData.minimum_quantity : null,
          purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentItem.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Item updated successfully.',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteItem = async () => {
    if (!currentItem) return;
    
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', currentItem.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
      
      setIsDeleteDialogOpen(false);
      fetchItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const openEditDialog = (item: Item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      serial_number: item.serial_number || '',
      barcode: item.barcode || '',
      condition: item.condition,
      category_id: item.category_id,
      location_id: item.location_id,
      is_consumable: item.is_consumable,
      quantity: item.quantity || 1,
      minimum_quantity: item.minimum_quantity,
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price,
      warranty_expiration: item.warranty_expiration || '',
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (item: Item) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serial_number: '',
      barcode: '',
      condition: 'good',
      category_id: '',
      location_id: '',
      is_consumable: false,
      quantity: 1,
      minimum_quantity: null,
      purchase_date: '',
      purchase_price: null,
      warranty_expiration: '',
      notes: ''
    });
  };
  
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };
  
  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  };
  
  if (!currentAssociation) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Association Found</CardTitle>
            <CardDescription>You need to set up your association first</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with inventory management, you need to create or join an association.</p>
            <Button className="mt-2" asChild>
              <a href="/association">Set Up Association</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">Loading inventory items...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            {items.length} items in inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-0.5 top-0.5 h-8 w-8 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline-block ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity
                  {sortField === 'quantity' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline-block ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p>No items found</p>
                    <p className="text-sm text-muted-foreground">Add your first inventory item to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryName(item.category_id)}</TableCell>
                    <TableCell>{getLocationName(item.location_id)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.condition === 'new' ? 'default' : 
                        item.condition === 'good' ? 'secondary' :
                        item.condition === 'fair' ? 'outline' :
                        item.condition === 'poor' ? 'destructive' :
                        'outline'
                      }>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.is_consumable ? (item.quantity || 0) : 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.is_consumable ? 'Consumable' : 'Asset'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory. Fill out the form below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="purchase">Purchase Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({...formData, category_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => setFormData({...formData, location_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: string) => setFormData({...formData, condition: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="item_type">Item Type</Label>
                    <RadioGroup 
                      value={formData.is_consumable ? "consumable" : "asset"}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        is_consumable: value === "consumable",
                        quantity: value === "consumable" ? formData.quantity : 1
                      })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asset" id="asset" />
                        <Label htmlFor="asset">Asset (unique item)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumable" id="consumable" />
                        <Label htmlFor="consumable">Consumable (with quantity)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {formData.is_consumable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
                        <Input
                          id="minimum_quantity"
                          type="number"
                          min="0"
                          value={formData.minimum_quantity || ''}
                          onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value ? parseInt(e.target.value) : null})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="purchase" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price || ''}
                      onChange={(e) => setFormData({...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : null})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
                    <Input
                      id="warranty_expiration"
                      type="date"
                      value={formData.warranty_expiration}
                      onChange={(e) => setFormData({...formData, warranty_expiration: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!formData.name || !formData.category_id || !formData.location_id}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update details for this inventory item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="purchase">Purchase Info</TabsTrigger>
              </TabsList>
              
              {/* Same tab content as Add Dialog with prefilled values */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Copy form fields from Add Dialog */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({...formData, category_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-location">Location *</Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => setFormData({...formData, location_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Copy form fields from Add Dialog */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-serial_number">Serial Number</Label>
                    <Input
                      id="edit-serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-barcode">Barcode</Label>
                    <Input
                      id="edit-barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-condition">Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: string) => setFormData({...formData, condition: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Input
                      id="edit-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-item_type">Item Type</Label>
                    <RadioGroup 
                      value={formData.is_consumable ? "consumable" : "asset"}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        is_consumable: value === "consumable",
                        quantity: value === "consumable" ? formData.quantity : 1
                      })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asset" id="edit-asset" />
                        <Label htmlFor="edit-asset">Asset (unique item)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumable" id="edit-consumable" />
                        <Label htmlFor="edit-consumable">Consumable (with quantity)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {formData.is_consumable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="edit-quantity">Quantity</Label>
                        <Input
                          id="edit-quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="edit-minimum_quantity">Minimum Quantity</Label>
                        <Input
                          id="edit-minimum_quantity"
                          type="number"
                          min="0"
                          value={formData.minimum_quantity || ''}
                          onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value ? parseInt(e.target.value) : null})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="purchase" className="space-y-4 mt-4">
                {/* Copy form fields from Add Dialog */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-purchase_date">Purchase Date</Label>
                    <Input
                      id="edit-purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-purchase_price">Purchase Price</Label>
                    <Input
                      id="edit-purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price || ''}
                      onChange={(e) => setFormData({...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : null})}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="edit-warranty_expiration">Warranty Expiration</Label>
                    <Input
                      id="edit-warranty_expiration"
                      type="date"
                      value={formData.warranty_expiration}
                      onChange={(e) => setFormData({...formData, warranty_expiration: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={!formData.name || !formData.category_id || !formData.location_id}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentItem && (
            <div className="py-4">
              <p className="font-semibold">{currentItem.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentItem.description || 'No description'}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryItems;
