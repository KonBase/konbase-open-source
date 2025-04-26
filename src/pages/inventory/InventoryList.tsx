import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAssociation } from '@/contexts/AssociationContext';
import { Link } from 'react-router-dom';
import InventoryItemsPage from './InventoryItems'; // Import the page component

const InventoryList = () => {
  const { currentAssociation, isLoading } = useAssociation();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Simplified Loading Skeleton */}
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        <div className="border rounded-lg p-4 mt-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          <div className="h-64 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!currentAssociation) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>
              Please select or create an association to manage inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Use Link component for internal navigation */}
            <Button asChild>
              <Link to="/association">Go to Associations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the InventoryItemsPage directly as the main content
  // The Add Item button is now part of InventoryItemsPage
  return <InventoryItemsPage />;

  /*
  // Original structure kept for reference, but InventoryItemsPage is now the main view
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Box className="h-7 w-7" /> Inventory Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview and management of your association's inventory items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Add Item button is now inside InventoryItemsPage/Component *\/}
          {/* <Button asChild>
            <Link to="/inventory/items/new"> // This route might not exist anymore
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Item
            </Link>
          </Button> *\/}
          <Button variant="outline" asChild>
            <Link to="/inventory/categories">
              <FolderTree className="h-4 w-4 mr-2" />
              Manage Categories
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/inventory/locations">
              <MapPin className="h-4 w-4 mr-2" />
              Manage Locations
            </Link>
          </Button>
          {/* Consider adding links to Documents and Sets if needed here *\/}
        </div>
      </div>

      {/* Render the actual item list/management component *\/}
      {/* This was InventoryItems component, now likely handled by InventoryItemsPage *\/}
      <InventoryItemsPage />
    </div>
  );
  */
};

export default InventoryList;
