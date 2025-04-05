
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  barcode: string | null;
  condition: string | null;
  categoryId: string | null;
  locationId: string | null;
  isConsumable: boolean;
  quantity: number;
  minimumQuantity: number | null;
  unitPrice: number | null;
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  image: string | null;
  associationId: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  locationName?: string;
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'locationName'>;

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();

  useEffect(() => {
    if (currentAssociation) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [currentAssociation]);

  const fetchItems = async () => {
    if (!currentAssociation) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(name),
          locations(name)
        `)
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (error) throw error;

      const formattedItems = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        serialNumber: item.serial_number,
        barcode: item.barcode,
        condition: item.condition,
        categoryId: item.category_id,
        locationId: item.location_id,
        isConsumable: item.is_consumable,
        quantity: item.quantity,
        minimumQuantity: item.minimum_quantity,
        unitPrice: item.purchase_price, // Changed from unit_price to purchase_price to match DB schema
        purchaseDate: item.purchase_date,
        warrantyExpiration: item.warranty_expiration,
        image: item.image,
        associationId: item.association_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        categoryName: item.categories?.name,
        locationName: item.locations?.name
      }));

      setItems(formattedItems);
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

  const createItem = async (newItem: NewInventoryItem) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      
      const { error } = await supabase
        .from('items')
        .insert({
          id,
          name: newItem.name,
          description: newItem.description,
          serial_number: newItem.serialNumber,
          barcode: newItem.barcode,
          condition: newItem.condition,
          category_id: newItem.categoryId,
          location_id: newItem.locationId,
          is_consumable: newItem.isConsumable,
          quantity: newItem.quantity,
          minimum_quantity: newItem.minimumQuantity,
          purchase_price: newItem.unitPrice, // Changed to purchase_price to match DB schema
          purchase_date: newItem.purchaseDate,
          warranty_expiration: newItem.warrantyExpiration,
          image: newItem.image,
          association_id: currentAssociation.id,
          created_at: now,
          updated_at: now
        });

      if (error) throw error;
      
      // Fetch the newly created item with joined category and location names
      await fetchItems();
      
      return true;
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<NewInventoryItem>) => {
    try {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Map the camelCase properties to snake_case for the database
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
      if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
      if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.locationId !== undefined) dbUpdates.location_id = updates.locationId;
      if (updates.isConsumable !== undefined) dbUpdates.is_consumable = updates.isConsumable;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.minimumQuantity !== undefined) dbUpdates.minimum_quantity = updates.minimumQuantity;
      if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.warrantyExpiration !== undefined) dbUpdates.warranty_expiration = updates.warrantyExpiration;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      
      const { error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Refresh the items list
      await fetchItems();
      
      return true;
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    items,
    loading,
    refreshItems: fetchItems,
    createItem,
    updateItem,
    deleteItem
  };
}
