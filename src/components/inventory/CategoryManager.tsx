
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { FolderIcon, PlusIcon, TrashIcon, Pencil } from 'lucide-react';
import { Category, useCategories } from '@/hooks/useCategories';

interface CategoryManagerProps {
  minimal?: boolean;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ minimal = false }) => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentId: '' as string | null
  });
  const { toast } = useToast();

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive'
      });
      return;
    }
    
    const result = await createCategory(
      newCategory.name,
      newCategory.description,
      newCategory.parentId || undefined
    );
    
    if (result) {
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
      setIsAddDialogOpen(false);
      setNewCategory({ name: '', description: '', parentId: null });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    const success = await updateCategory(editingCategory.id, {
      name: editingCategory.name,
      description: editingCategory.description,
      parentId: editingCategory.parentId
    });
    
    if (success) {
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;
    
    const success = await deleteCategory(id);
    if (success) {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Minimal view for dashboard
  if (minimal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <FolderIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No categories yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.slice(0, 5).map(category => (
                <div key={category.id} className="flex justify-between items-center py-1">
                  <span>{category.name}</span>
                </div>
              ))}
              {categories.length > 5 && (
                <Button variant="link" size="sm" className="px-0">View all {categories.length} categories</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Item Categories</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-10">
              <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Categories Yet</h3>
              <p className="mt-1 text-muted-foreground">
                Get started by creating your first category.
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell>
                      {category.parentId 
                        ? categories.find(c => c.id === category.parentId)?.name || 'Unknown'
                        : 'None'
                      }
                    </TableCell>
                    <TableCell className="text-right">
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
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing your inventory items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Electronics, Audio Equipment"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe this category..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <Select
                value={newCategory.parentId || ''}
                onValueChange={(value) => setNewCategory({
                  ...newCategory,
                  parentId: value === '' ? null : value
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
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewCategory({ name: '', description: '', parentId: null });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
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
                <Label htmlFor="edit-description">Description (Optional)</Label>
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
                <Label htmlFor="edit-parent">Parent Category (Optional)</Label>
                <Select
                  value={editingCategory.parentId || ''}
                  onValueChange={(value) => setEditingCategory({
                    ...editingCategory,
                    parentId: value === '' ? null : value
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
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCategory(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManager;
