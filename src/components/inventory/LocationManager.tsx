import React, { useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { useLocations, Location } from '@/hooks/useLocations';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Edit,
  Trash,
  ChevronRight,
  Home,
  FolderOpen,
  Loader2,
  Building
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface LocationNodeProps {
  location: Location;
  children?: React.ReactNode;
  level: number;
  onEditClick: (location: Location) => void;
  onDeleteClick: (location: Location) => void;
}

interface LocationWithChildren extends Location {
  children: LocationWithChildren[];
}

const LocationNode: React.FC<LocationNodeProps> = ({ 
  location, 
  children, 
  level, 
  onEditClick, 
  onDeleteClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mb-1">
      <div 
        className={`flex items-center p-2 rounded-md hover:bg-muted`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {children ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 mr-1" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight className={`h-4 w-4 ${isExpanded ? 'rotate-90' : ''} transition-transform`} />
          </Button>
        ) : (
          <span className="w-7"></span>
        )}
        
        {location.isRoom ? (
          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
        ) : (
          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
        )}
        
        <span className="flex-1 font-medium">{location.name}</span>
        
        {location.isRoom && (
          <Badge variant="outline" className="mr-2">Room</Badge>
        )}
        
        <div className="flex">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditClick(location)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteClick(location)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && children}
    </div>
  );
};

const LocationManager: React.FC = () => {
  const { currentAssociation } = useAssociation();
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    isRoom: false
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      isRoom: false
    });
  };
  
  const handleAddLocation = async () => {
    try {
      await createLocation(
        formData.name,
        formData.description,
        formData.parentId || undefined,
        formData.isRoom
      );
      
      toast({
        title: 'Success',
        description: 'Location created successfully.',
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleEditLocation = async () => {
    if (!currentLocation) return;
    
    try {
      await updateLocation(currentLocation.id, {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || null,
        isRoom: formData.isRoom
      });
      
      toast({
        title: 'Success',
        description: 'Location updated successfully.',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteLocation = async () => {
    if (!currentLocation) return;
    
    try {
      const success = await deleteLocation(currentLocation.id);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Location deleted successfully.',
        });
        
        setIsDeleteDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
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
  
  const buildLocationTree = () => {
    const locationMap = new Map<string, LocationWithChildren>();
    
    locations.forEach(location => {
      locationMap.set(location.id, { ...location, children: [] });
    });
    
    const rootLocations: LocationWithChildren[] = [];
    
    locationMap.forEach(location => {
      if (location.parentId && locationMap.has(location.parentId)) {
        locationMap.get(location.parentId)?.children.push(location);
      } else {
        rootLocations.push(location);
      }
    });
    
    rootLocations.sort((a, b) => a.name.localeCompare(b.name));
    locationMap.forEach(location => {
      location.children.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return rootLocations;
  };
  
  const renderLocationTree = (locations: LocationWithChildren[], level: number = 0) => {
    return (
      <div>
        {locations.map(location => (
          <LocationNode 
            key={location.id} 
            location={location} 
            level={level}
            onEditClick={openEditDialog}
            onDeleteClick={openDeleteDialog}
          >
            {location.children.length > 0 && renderLocationTree(location.children, level + 1)}
          </LocationNode>
        ))}
      </div>
    );
  };
  
  const getLocationOptions = (excludeLocationId?: string) => {
    const filteredLocations = locations.filter(loc => 
      !excludeLocationId || loc.id !== excludeLocationId
    );
    
    return filteredLocations.map(location => (
      <SelectItem key={location.id} value={location.id}>
        {location.name}
      </SelectItem>
    ));
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
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
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Locations Defined</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add storage locations to organize your inventory items.
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Add Your First Location
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              {renderLocationTree(buildLocationTree())}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>
              Add a new storage location to organize your inventory.
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
              
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="parent">Parent Location</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({...formData, parentId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Top Level)</SelectItem>
                    {getLocationOptions()}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-room"
                  checked={formData.isRoom}
                  onCheckedChange={(checked) => setFormData({...formData, isRoom: checked as boolean})}
                />
                <Label htmlFor="is-room">This is a room</Label>
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
            <Button onClick={handleAddLocation} disabled={!formData.name}>
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the details for this storage location.
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
              
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="edit-parent">Parent Location</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({...formData, parentId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Top Level)</SelectItem>
                    {currentLocation && getLocationOptions(currentLocation.id)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-room"
                  checked={formData.isRoom}
                  onCheckedChange={(checked) => setFormData({...formData, isRoom: checked as boolean})}
                />
                <Label htmlFor="edit-is-room">This is a room</Label>
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
            <Button onClick={handleEditLocation} disabled={!formData.name}>
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
              Are you sure you want to delete this location? You must ensure there are no items assigned to this location first.
            </DialogDescription>
          </DialogHeader>
          
          {currentLocation && (
            <div className="py-4">
              <p className="font-semibold">{currentLocation.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentLocation.description || 'No description'}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationManager;
