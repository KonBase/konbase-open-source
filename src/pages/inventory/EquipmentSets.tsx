import React, { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  PlusCircle, 
  Plus, 
  Edit, 
  Trash, 
  Package,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Search,
  BoxSelect
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EquipmentSet {
  id: string;
  name: string;
  description: string | null;
  association_id: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  location_id: string;
  condition: string;
  is_consumable: boolean;
  quantity: number | null;
}

interface SetItem {
  set_id: string;
  item_id: string;
  quantity: number;
  item_name?: string;
  item_description?: string;
}

const EquipmentSets = () => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  
  const [sets, setSets] = useState<EquipmentSet[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [setItemsMap, setSetItemsMap] = useState<{ [key: string]: SetItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [expandedSets, setExpandedSets] = useState<string[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [currentSet, setCurrentSet] = useState<EquipmentSet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  const [itemFormData, setItemFormData] = useState({
    item_id: '',
    quantity: 1
  });
  
  useEffect(() => {
    if (currentAssociation) {
      fetchSets();
      fetchItems();
    } else {
      setSets([]);
      setItems([]);
      setLoading(false);
    }
  }, [currentAssociation]);
  
  const fetchSets = async () => {
    if (!currentAssociation) return;
    
    setLoading(true);
    try {
      const { data: setsData, error: setsError } = await supabase
        .from('equipment_sets')
        .select('*')
        .eq('association_id', currentAssociation.id);
      
      if (setsError) throw setsError;
      
      const setsWithItemCount = await Promise.all(setsData.map(async (set) => {
        const { count, error: countError } = await supabase
          .from('equipment_set_items')
          .select('*', { count: 'exact', head: true })
          .eq('set_id', set.id);
        
        if (countError) throw countError;
        
        return {
          ...set,
          item_count: count || 0
        };
      }));
      
      setSets(setsWithItemCount);
      
      for (const set of setsData) {
        await fetchSetItems(set.id);
      }
    } catch (error: any) {
      console.error('Error fetching equipment sets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load equipment sets.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchItems = async () => {
    if (!currentAssociation) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, description, category_id, location_id, condition, is_consumable, quantity')
        .eq('association_id', currentAssociation.id)
        .order('name');
      
      if (error) throw error;
      
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive'
      });
    }
  };
  
  const fetchSetItems = async (setId: string) => {
    try {
      const { data, error } = await supabase
        .from('equipment_set_items')
        .select(`
          set_id,
          item_id,
          quantity,
          items:item_id (
            name,
            description
          )
        `)
        .eq('set_id', setId);
      
      if (error) throw error;
      
      const formattedItems: SetItem[] = data.map(item => ({
        set_id: item.set_id,
        item_id: item.item_id,
        quantity: item.quantity,
        item_name: item.items.name,
        item_description: item.items.description
      }));
      
      setSetItemsMap(prev => ({
        ...prev,
        [setId]: formattedItems
      }));
    } catch (error: any) {
      console.error(`Error fetching items for set ${setId}:`, error);
    }
  };
  
  const handleAddSet = async () => {
    if (!currentAssociation) return;
    
    try {
      const { data, error } = await supabase
        .from('equipment_sets')
        .insert({
          name: formData.name,
          description: formData.description || null,
          association_id: currentAssociation.id
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Equipment set created successfully.',
      });
      
      setIsAddDialogOpen(false);
      resetForm();
      fetchSets();
    } catch (error: any) {
      console.error('Error adding equipment set:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleEditSet = async () => {
    if (!currentSet) return;
    
    try {
      const { error } = await supabase
        .from('equipment_sets')
        .update({
          name: formData.name,
          description: formData.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSet.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Equipment set updated successfully.',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchSets();
    } catch (error: any) {
      console.error('Error updating equipment set:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteSet = async () => {
    if (!currentSet) return;
    
    try {
      const { error: itemsError } = await supabase
        .from('equipment_set_items')
        .delete()
        .eq('set_id', currentSet.id);
      
      if (itemsError) throw itemsError;
      
      const { error } = await supabase
        .from('equipment_sets')
        .delete()
        .eq('id', currentSet.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Equipment set deleted successfully.',
      });
      
      setIsDeleteDialogOpen(false);
      fetchSets();
    } catch (error: any) {
      console.error('Error deleting equipment set:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleAddItemToSet = async () => {
    if (!currentSet) return;
    
    try {
      const { data: existingItems, error: checkError } = await supabase
        .from('equipment_set_items')
        .select('*')
        .eq('set_id', currentSet.id)
        .eq('item_id', itemFormData.item_id);
      
      if (checkError) throw checkError;
      
      if (existingItems && existingItems.length > 0) {
        const { error } = await supabase
          .from('equipment_set_items')
          .update({
            quantity: existingItems[0].quantity + itemFormData.quantity
          })
          .eq('set_id', currentSet.id)
          .eq('item_id', itemFormData.item_id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment_set_items')
          .insert({
            set_id: currentSet.id,
            item_id: itemFormData.item_id,
            quantity: itemFormData.quantity
          });
        
        if (error) throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Item added to equipment set.',
      });
      
      setIsAddItemDialogOpen(false);
      resetItemForm();
      fetchSetItems(currentSet.id);
      fetchSets();
    } catch (error: any) {
      console.error('Error adding item to set:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleRemoveItemFromSet = async (setId: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from('equipment_set_items')
        .delete()
        .eq('set_id', setId)
        .eq('item_id', itemId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Item removed from equipment set.',
      });
      
      fetchSetItems(setId);
      fetchSets();
    } catch (error: any) {
      console.error('Error removing item from set:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const toggleExpandSet = (setId: string) => {
    setExpandedSets(prev => {
      if (prev.includes(setId)) {
        return prev.filter(id => id !== setId);
      } else {
        return [...prev, setId];
      }
    });
  };
  
  const openEditDialog = (set: EquipmentSet) => {
    setCurrentSet(set);
    setFormData({
      name: set.name,
      description: set.description || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (set: EquipmentSet) => {
    setCurrentSet(set);
    setIsDeleteDialogOpen(true);
  };
  
  const openAddItemDialog = (set: EquipmentSet) => {
    setCurrentSet(set);
    resetItemForm();
    setIsAddItemDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };
  
  const resetItemForm = () => {
    setItemFormData({
      item_id: '',
      quantity: 1
    });
  };
  
  const getFilteredItems = () => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query))
    );
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
            <p className="mb-4">To get started with equipment sets, you need to create or join an association.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Equipment Sets</h1>
            <p className="text-muted-foreground">Loading equipment sets...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
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
          <h1 className="text-3xl font-bold tracking-tight">Equipment Sets</h1>
          <p className="text-muted-foreground">
            {sets.length} equipment sets defined
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Equipment Set
        </Button>
      </div>
      
      {sets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BoxSelect className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Equipment Sets Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Equipment sets allow you to group items that are commonly used together for events, activities, or specific purposes.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sets.map(set => (
            <Card key={set.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{set.name}</CardTitle>
                    <CardDescription>
                      {set.item_count} {set.item_count === 1 ? 'item' : 'items'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(set)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(set)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {set.description && <p className="text-sm text-muted-foreground">{set.description}</p>}
              </CardContent>
              <div>
                <Collapsible
                  open={expandedSets.includes(set.id)}
                  onOpenChange={() => toggleExpandSet(set.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex justify-between items-center rounded-none">
                      <span>Items in this set</span>
                      {expandedSets.includes(set.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t">
                      {setItemsMap[set.id] && setItemsMap[set.id].length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {setItemsMap[set.id].map((item) => (
                              <TableRow key={item.item_id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{item.item_name}</p>
                                    {item.item_description && (
                                      <p className="text-xs text-muted-foreground">{item.item_description}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItemFromSet(set.id, item.item_id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No items in this set yet.</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={() => openAddItemDialog(set)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item to Set
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Equipment Set</DialogTitle>
            <DialogDescription>
              Group items that are commonly used together for events, activities, or specific purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddSet} disabled={!formData.name}>
              Create Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Equipment Set</DialogTitle>
            <DialogDescription>
              Update the details for this equipment set.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSet} disabled={!formData.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this equipment set? This will also remove all items from the set.
            </DialogDescription>
          </DialogHeader>
          
          {currentSet && (
            <div className="py-4">
              <p className="font-semibold">{currentSet.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentSet.description || 'No description'}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSet}>
              Delete Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Item to Equipment Set</DialogTitle>
            <DialogDescription>
              {currentSet && `Select an item to add to "${currentSet.name}".`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="search-items">Search Items</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-items"
                  placeholder="Search by name or description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                min="1"
                value={itemFormData.quantity}
                onChange={(e) => setItemFormData({...itemFormData, quantity: parseInt(e.target.value) || 1})}
                className="mt-1"
              />
            </div>
            
            <div className="mb-2">
              <Label>Select an Item</Label>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-4 space-y-2">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No items found.</p>
                  </div>
                ) : (
                  getFilteredItems().map(item => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-accent ${
                        itemFormData.item_id === item.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setItemFormData({...itemFormData, item_id: item.id})}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        {itemFormData.item_id === item.id && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddItemDialogOpen(false);
              resetItemForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddItemToSet} disabled={!itemFormData.item_id}>
              Add to Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentSets;
