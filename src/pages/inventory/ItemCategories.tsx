
import React, { useEffect, useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FolderIcon, PlusIcon, TrashIcon, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  parentName?: string;
  itemsCount: number;
}

const ItemCategories = () => {
  const { currentAssociation } = useAssociation();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parent_id: '' as string | null
  });
  
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentAssociation) return;
      
      setIsLoading(true);
      try {
        // Fetch categories with their parent names and item counts
        const { data, error } = await supabase
          .from('categories')
          .select('*, parent:parent_id(name)')
          .eq('association_id', currentAssociation.id);
        
        if (error) throw error;
        
        // Get item counts for each category
        const categoriesWithCounts = await Promise.all(data.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
            
          if (countError) throw countError;
          
          return {
            id: category.id,
            name: category.name,
            description: category.description,
            parent_id: category.parent_id,
            parentName: category.parent?.name,
            itemsCount: count || 0
          };
        }));
        
        setCategories(categoriesWithCounts);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [currentAssociation]);

  const handleCreateCategory = async () => {
    if (!currentAssociation || !newCategory.name) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          description: newCategory.description || null,
          parent_id: newCategory.parent_id || null,
          association_id: currentAssociation.id
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      // Find parent name if there's a parent_id
      let parentName;
      if (data.parent_id) {
        const parent = categories.find(cat => cat.id === data.parent_id);
        parentName = parent?.name;
      }
      
      // Add the new category to the list
      setCategories(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description,
        parent_id: data.parent_id,
        parentName,
        itemsCount: 0
      }]);
      
      toast({
        title: "Category Created",
        description: "Successfully created new category.",
      });
      
      setIsDialogOpen(false);
      setNewCategory({ name: '', description: '', parent_id: null });
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!currentAssociation || !editingCategory) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
          parent_id: editingCategory.parent_id
        })
        .eq('id', editingCategory.id);
        
      if (error) throw error;
      
      // Find parent name if there's a parent_id
      let parentName;
      if (editingCategory.parent_id) {
        const parent = categories.find(cat => cat.id === editingCategory.parent_id);
        parentName = parent?.name;
      }
      
      // Update the category in the list
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...editingCategory, parentName } 
          : cat
      ));
      
      toast({
        title: "Category Updated",
        description: "Successfully updated category.",
      });
      
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!currentAssociation) return;
    
    // Check if category has items or is a parent to other categories
    const category = categories.find(cat => cat.id === id);
    if (!category) return;
    
    if (category.itemsCount > 0) {
      toast({
        title: "Cannot Delete",
        description: "This category has items assigned to it. Reassign items first.",
        variant: "destructive"
      });
      return;
    }
    
    const hasChildren = categories.some(cat => cat.parent_id === id);
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This category has subcategories. Remove subcategories first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove the category from the list
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: "Category Deleted",
        description: "Successfully deleted category.",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive"
      });
    }
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
            <p className="mb-4">To get started with EventNexus, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup">Set Up Association</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Categories</h1>
          <p className="text-muted-foreground">Manage categories for inventory items.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category for organizing your inventory items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Electronics, Audio Equipment"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this category..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Category (Optional)</Label>
                <Select 
                  value={newCategory.parent_id || ''} 
                  onValueChange={(value) => setNewCategory({
                    ...newCategory, 
                    parent_id: value === '' ? null : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCategory} 
                disabled={!newCategory.name}
              >
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingCategory && (
          <Dialog 
            open={!!editingCategory} 
            onOpenChange={(open) => !open && setEditingCategory(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update this category's details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Category Name</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory, 
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory, 
                      description: e.target.value || null
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-parent">Parent Category</Label>
                  <Select 
                    value={editingCategory.parent_id || ''} 
                    onValueChange={(value) => setEditingCategory({
                      ...editingCategory, 
                      parent_id: value === '' ? null : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories
                        .filter(cat => cat.id !== editingCategory.id)
                        .map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCategory} 
                  disabled={!editingCategory.name}
                >
                  Update Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10">
              <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Categories Yet</h3>
              <p className="mt-1 text-muted-foreground">
                Get started by creating your first category.
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell>{category.parentName || 'None'}</TableCell>
                    <TableCell>{category.itemsCount}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemCategories;
