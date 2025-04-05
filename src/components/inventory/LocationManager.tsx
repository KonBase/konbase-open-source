
import React, { useState } from 'react';
import { useLocations, Location } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Pencil, Trash, FolderTree, MapPin, Home, Room } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

// Helper function to build a tree structure from flat locations
const buildLocationTree = (locations: Location[]): (Location & { children: Location[] })[] => {
  const locationsMap: Record<string, Location & { children: Location[] }> = {};
  
  // Initialize map with all locations
  locations.forEach(location => {
    locationsMap[location.id] = { ...location, children: [] };
  });
  
  // Build the tree structure
  const rootLocations: (Location & { children: Location[] })[] = [];
  
  locations.forEach(location => {
    if (location.parentId) {
      // Add to parent's children if parent exists
      if (locationsMap[location.parentId]) {
        locationsMap[location.parentId].children.push(locationsMap[location.id]);
      } else {
        // If parent doesn't exist (data inconsistency), add to root
        rootLocations.push(locationsMap[location.id]);
      }
    } else {
      // Add to root locations if no parent
      rootLocations.push(locationsMap[location.id]);
    }
  });
  
  return rootLocations;
};

const LocationManager = () => {
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    isRoom: false
  });
  
  // Prepare the tree view data when in tree mode
  const locationTree = buildLocationTree(locations);
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      isRoom: false
    });
  };
  
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  const openEditDialog = (location: Location) => {
    setCurrentLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      parentId: location.parentId || '',
      isRoom: location.isRoom
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (location: Location) => {
    setCurrentLocation(location);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateLocation = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createLocation(
        formData.name,
        formData.description,
        formData.parentId || undefined,
        formData.isRoom
      );
      
      setIsAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateLocation = async () => {
    if (!currentLocation || !formData.name) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateLocation(currentLocation.id, {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || null,
        isRoom: formData.isRoom
      });
      
      setIsEditDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteLocation = async () => {
    if (!currentLocation) return;
    
    try {
      const success = await deleteLocation(currentLocation.id);
      
      if (success) {
        setIsDeleteDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Location deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };
  
  const renderLocationTreeItem = (location: Location & { children: Location[] }, depth = 0) => {
    return (
      <React.Fragment key={location.id}>
        <TableRow>
          <TableCell className="font-medium">
            <div style={{ paddingLeft: `${depth * 1.5}rem` }} className="flex items-center">
              {location.isRoom ? <Room className="h-4 w-4 mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
              {location.name}
            </div>
          </TableCell>
          <TableCell>{location.description || "-"}</TableCell>
          <TableCell>
            {location.isRoom ? (
              <Badge variant="outline">Room</Badge>
            ) : (
              <Badge>Storage</Badge>
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(location)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(location)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {location.children && location.children.map(child => 
          renderLocationTreeItem(child, depth + 1)
        )}
      </React.Fragment>
    );
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Storage Locations</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            >
              {viewMode === 'list' ? (
                <>
                  <FolderTree className="h-4 w-4 mr-2" />
                  Tree View
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  List View
                </>
              )}
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Locations Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Storage locations help you track where your inventory items are stored.
              </p>
              <Button className="mt-4" onClick={openAddDialog}>
                Create Your First Location
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'list' ? (
                    locations.map(location => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {location.isRoom ? <Room className="h-4 w-4 mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                            {location.name}
                            {location.parentId && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Sublocation)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{location.description || "-"}</TableCell>
                        <TableCell>
                          {location.isRoom ? (
                            <Badge variant="outline">Room</Badge>
                          ) : (
                            <Badge>Storage</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(location)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(location)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    locationTree.map(location => renderLocationTreeItem(location))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Create a new storage location or room.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter location name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter location description"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Location (Optional)</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({...formData, parentId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-room" 
                checked={formData.isRoom}
                onCheckedChange={(checked) => 
                  setFormData({...formData, isRoom: checked === true})
                }
              />
              <Label htmlFor="is-room">This is a room (not a storage container)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLocation}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Location Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Location</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({...formData, parentId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {locations
                    .filter(location => location.id !== currentLocation?.id)
                    .map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-is-room" 
                checked={formData.isRoom}
                onCheckedChange={(checked) => 
                  setFormData({...formData, isRoom: checked === true})
                }
              />
              <Label htmlFor="edit-is-room">This is a room (not a storage container)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Location Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? Any sublocations or items stored in this location must be updated first.
            </DialogDescription>
          </DialogHeader>
          
          {currentLocation && (
            <div className="py-4">
              <p className="font-medium">{currentLocation.name}</p>
              {currentLocation.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentLocation.description}</p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationManager;
