import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface Location {
  id: string;
  name: string;
  description: string | null;
  associationId: string;
  parentId: string | null;
  isRoom: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentAssociation } = useAssociation();

  useEffect(() => {
    if (currentAssociation) {
      fetchLocations();
    } else {
      setLocations([]);
      setLoading(false);
    }
  }, [currentAssociation]);

  const fetchLocations = async () => {
    if (!currentAssociation) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (error) throw error;

      const formattedLocations = data.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        associationId: loc.association_id,
        parentId: loc.parent_id,
        isRoom: loc.is_room || false,
        createdAt: loc.created_at,
        updatedAt: loc.updated_at
      }));

      setLocations(formattedLocations);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load locations.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async (name: string, options?: { 
    description?: string; 
    parentId?: string; 
    isRoom?: boolean;
  }) => {
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
        .from('locations')
        .insert({
          id,
          name,
          description: options?.description || null,
          association_id: currentAssociation.id,
          parent_id: options?.parentId || null,
          is_room: options?.isRoom || false,
          created_at: now,
          updated_at: now
        });

      if (error) throw error;

      const { data: newLocationData, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      const newLocation: Location = {
        id: newLocationData.id,
        name: newLocationData.name,
        description: newLocationData.description,
        associationId: newLocationData.association_id,
        parentId: newLocationData.parent_id,
        isRoom: newLocationData.is_room || false,
        createdAt: newLocationData.created_at,
        updatedAt: newLocationData.updated_at
      };

      setLocations(prev => [...prev, newLocation]);
      return newLocation;
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateLocation = async (id: string, updates: { 
    name?: string; 
    description?: string | null; 
    parentId?: string | null;
    isRoom?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: updates.name,
          description: updates.description,
          parent_id: updates.parentId,
          is_room: updates.isRoom,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setLocations(prev =>
        prev.map(loc =>
          loc.id === id
            ? { 
                ...loc, 
                name: updates.name || loc.name, 
                description: updates.description !== undefined ? updates.description : loc.description,
                parentId: updates.parentId !== undefined ? updates.parentId : loc.parentId,
                isRoom: updates.isRoom !== undefined ? updates.isRoom : loc.isRoom,
                updatedAt: new Date().toISOString()
              }
            : loc
        )
      );
      
      return true;
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      // Check if location has items
      const { count, error: countError } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('location_id', id);

      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This location has ${count} items stored in it. Please move or delete these items first.`,
          variant: 'destructive'
        });
        return false;
      }

      // Check if location has children
      const { count: childCount, error: childCountError } = await supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id);

      if (childCountError) throw childCountError;
      
      if (childCount && childCount > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This location has ${childCount} sub-locations. Please delete these sub-locations first.`,
          variant: 'destructive'
        });
        return false;
      }

      // Proceed with deletion
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    locations,
    loading,
    refreshLocations: fetchLocations,
    createLocation,
    updateLocation: async (id: string, updates: { 
      name?: string; 
      description?: string | null; 
      parentId?: string | null;
      isRoom?: boolean;
    }) => {
      try {
        const { error } = await supabase
          .from('locations')
          .update({
            name: updates.name,
            description: updates.description,
            parent_id: updates.parentId,
            is_room: updates.isRoom,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        setLocations(prev =>
          prev.map(loc =>
            loc.id === id
              ? { 
                  ...loc, 
                  name: updates.name || loc.name, 
                  description: updates.description !== undefined ? updates.description : loc.description,
                  parentId: updates.parentId !== undefined ? updates.parentId : loc.parentId,
                  isRoom: updates.isRoom !== undefined ? updates.isRoom : loc.isRoom,
                  updatedAt: new Date().toISOString()
                }
              : loc
          )
        );
        
        return true;
      } catch (error: any) {
        console.error('Error updating location:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }
    },
    deleteLocation: async (id: string) => {
      try {
        // Check if location has items
        const { count, error: countError } = await supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('location_id', id);

        if (countError) throw countError;
        
        if (count && count > 0) {
          toast({
            title: 'Cannot Delete',
            description: `This location has ${count} items stored in it. Please move or delete these items first.`,
            variant: 'destructive'
          });
          return false;
        }

        // Check if location has children
        const { count: childCount, error: childCountError } = await supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .eq('parent_id', id);

        if (childCountError) throw childCountError;
        
        if (childCount && childCount > 0) {
          toast({
            title: 'Cannot Delete',
            description: `This location has ${childCount} sub-locations. Please delete these sub-locations first.`,
            variant: 'destructive'
          });
          return false;
        }

        // Proceed with deletion
        const { error } = await supabase
          .from('locations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setLocations(prev => prev.filter(loc => loc.id !== id));
        return true;
      } catch (error: any) {
        console.error('Error deleting location:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }
    }
  };
}
