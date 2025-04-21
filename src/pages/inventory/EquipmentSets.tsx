import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BoxIcon, ArrowLeft } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import EquipmentSetManager from '@/components/inventory/EquipmentSetManager';
import { Link } from 'react-router-dom';

const EquipmentSetsPage = () => {
  const { currentAssociation, isLoading } = useAssociation();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted rounded"></div>
            </CardContent>
          </Card>
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
              Please select or create an association to manage equipment sets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/association">Go to Associations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Equipment Sets</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage reusable sets of equipment for your conventions
          </p>
        </div>
      </div>
      
      <EquipmentSetManager />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BoxIcon className="h-5 w-5" />
            About Equipment Sets
          </CardTitle>
          <CardDescription>
            Understanding how equipment sets can help your association
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Equipment sets help you group items that are commonly used together for conventions and events.
              By creating equipment sets, you can:
            </p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li>Quickly assign groups of equipment to convention rooms</li>
              <li>Create templates for recurring convention setups</li>
              <li>Track related equipment items as a single unit</li>
              <li>Simplify the planning process for new conventions</li>
            </ul>
            
            <p className="text-sm text-muted-foreground">
              To get started, create a new equipment set and add inventory items to it.
              You can then use these sets when setting up conventions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentSetsPage;