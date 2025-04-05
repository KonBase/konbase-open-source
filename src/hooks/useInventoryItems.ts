
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  barcode: string | null;
  condition: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyExpiration: string | null;
  categoryId: string;
  locationId: string;
  associationId: string;
  isConsumable: boolean;
  quantity: number | null;
  minimumQuantity: number | null;
  image: string | null;
  notes: string | null;
  categoryName?: string;
  locationName?: string;
  createdAt: string;
  updatedAt: string;
}

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
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
          categories:category_id (name),
          locations:location_id (name)
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
        purchaseDate: item.purchase_date,
        purchasePrice: item.purchase_price,
        warrantyExpiration: item.warranty_expiration,
        categoryId: item.category_id,
        locationId: item.location_id,
        associationId: item.association_id,
        isConsumable: item.is_consumable,
        quantity: item.quantity,
        minimumQuantity: item.minimum_quantity,
        image: item.image,
        notes: item.notes,
        categoryName: item.categories?.name,
        locationName: item.locations?.name,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'locationName'>) => {
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
          name: itemData.name,
          description: itemData.description,
          serial_number: itemData.serialNumber,
          barcode: itemData.barcode,
          condition: itemData.condition,
          purchase_date: itemData.purchaseDate,
          purchase_price: itemData.purchasePrice,
          warranty_expiration: itemData.warrantyExpiration,
          category_id: itemData.categoryId,
          location_id: itemData.locationId,
          association_id: currentAssociation.id,
          is_consumable: itemData.isConsumable,
          quantity: itemData.quantity,
          minimum_quantity: itemData.minimumQuantity,
          image: itemData.image,
          notes: itemData.notes,
          created_at: now,
          updated_at: now
        });

      if (error) throw error;
      
      // Fetch the newly created item with its relationships
      const { data: newItemData, error: fetchError } = await supabase
        .from('items')
        .select(`
          *,
          categories:category_id (name),
          locations:location_id (name)
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      const newItem: InventoryItem = {
        id: newItemData.id,
        name: newItemData.name,
        description: newItemData.description,
        serialNumber: newItemData.serial_number,
        barcode: newItemData.barcode,
        condition: newItemData.condition,
        purchaseDate: newItemData.purchase_date,
        purchasePrice: newItemData.purchase_price,
        warrantyExpiration: newItemData.warranty_expiration,
        categoryId: newItemData.category_id,
        locationId: newItemData.location_id,
        associationId: newItemData.association_id,
        isConsumable: newItemData.is_consumable,
        quantity: newItemData.quantity,
        minimumQuantity: newItemData.minimum_quantity,
        image: newItemData.image,
        notes: newItemData.notes,
        categoryName: newItemData.categories?.name,
        locationName: newItemData.locations?.name,
        createdAt: newItemData.created_at,
        updatedAt: newItemData.updated_at
      };

      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error: any) {
      console.error('Error creating inventory item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'locationName'>>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Convert camelCase to snake_case for Supabase
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber;
      if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
      if (updates.condition !== undefined) updateData.condition = updates.condition;
      if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate;
      if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice;
      if (updates.warrantyExpiration !== undefined) updateData.warranty_expiration = updates.warrantyExpiration;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.locationId !== undefined) updateData.location_id = updates.locationId;
      if (updates.isConsumable !== undefined) updateData.is_consumable = updates.isConsumable;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.minimumQuantity !== undefined) updateData.minimum_quantity = updates.minimumQuantity;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Fetch the updated item with its relationships
      const { data: updatedItemData, error: fetchError } = await supabase
        .from('items')
        .select(`
          *,
          categories:category_id (name),
          locations:location_id (name)
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      const updatedItem: InventoryItem = {
        id: updatedItemData.id,
        name: updatedItemData.name,
        description: updatedItemData.description,
        serialNumber: updatedItemData.serial_number,
        barcode: updatedItemData.barcode,
        condition: updatedItemData.condition,
        purchaseDate: updatedItemData.purchase_date,
        purchasePrice: updatedItemData.purchase_price,
        warrantyExpiration: updatedItemData.warranty_expiration,
        categoryId: updatedItemData.category_id,
        locationId: updatedItemData.location_id,
        associationId: updatedItemData.association_id,
        isConsumable: updatedItemData.is_consumable,
        quantity: updatedItemData.quantity,
        minimumQuantity: updatedItemData.minimum_quantity,
        image: updatedItemData.image,
        notes: updatedItemData.notes,
        categoryName: updatedItemData.categories?.name,
        locationName: updatedItemData.locations?.name,
        createdAt: updatedItemData.created_at,
        updatedAt: updatedItemData.updated_at
      };

      setItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
      );
      
      return updatedItem;
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return null;
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
      console.error('Error deleting inventory item:', error);
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
