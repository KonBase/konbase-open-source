
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/Link';
import { BoxIcon, PlusIcon, EditIcon, TrashIcon, BoxesIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';

interface EquipmentSet {
  id: string;
  name: string;
  description: string | null;
  association_id: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

const EquipmentSets = () => {
  const { currentAssociation } = useAssociation();
  const [equipmentSets, setEquipmentSets] = useState<EquipmentSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchEquipmentSets = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      // Fetch sets
      const { data: sets, error } = await supabase
        .from('equipment_sets')
        .select('*')
        .eq('association_id', currentAssociation.id);
      
      if (error) throw error;
      
      // Count items in each set
      const setsWithItemCounts = await Promise.all(
        sets.map(async (set) => {
          const { count, error: countError } = await supabase
            .from('equipment_set_items')
            .select('*', { count: 'exact', head: true })
            .eq('set_id', set.id);
          
          if (countError) throw countError;
          
          return { ...set, item_count: count || 0 };
        })
      );
      
      setEquipmentSets(setsWithItemCounts);
    } catch (error: any) {
      console.error('Error loading equipment sets:', error);
      toast({
        title: 'Error loading equipment sets',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEquipmentSets();
  }, [currentAssociation]);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-40 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-9 w-40 bg-muted rounded animate-pulse"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-24 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-3"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Sets</h1>
          <p className="text-muted-foreground">Manage predefined sets of equipment for quick allocation.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Equipment Set
        </Button>
      </div>
      
      {equipmentSets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <BoxIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Equipment Sets Yet</h3>
              <p className="mt-1 text-muted-foreground">
                Create your first equipment set to group items together for easy allocation.
              </p>
              <Button className="mt-4">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create First Set
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {equipmentSets.map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <CardTitle>{set.name}</CardTitle>
                <CardDescription>{set.item_count} items</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  {set.description || 'No description provided'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/inventory/sets/${set.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentSets;
