
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import InventoryItems from '@/components/inventory/InventoryItems';
import { Link } from 'react-router-dom';

const InventoryList = () => {
  const { currentAssociation, isLoading } = useAssociation();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!currentAssociation) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>
              Please select or create an association to manage inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/association'}>
              Go to Associations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your equipment, consumables, and other inventory items
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/inventory/items/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Item
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/inventory/categories">
              Manage Categories
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/inventory/locations">
              Manage Locations
            </Link>
          </Button>
        </div>
      </div>
      
      <InventoryItems />
    </div>
  );
};

export default InventoryList;
