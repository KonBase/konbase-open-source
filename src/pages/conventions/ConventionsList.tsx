
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

const ConventionsList = () => {
  const { currentAssociation, isLoading } = useAssociation();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
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
              Please select or create an association to manage conventions
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conventions</h1>
          <p className="text-muted-foreground">
            Manage your events and track equipment usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Convention
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Implementation In Progress</CardTitle>
          <CardDescription>
            The convention management module is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Coming features:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Convention creation from templates</li>
            <li>Equipment issuing and return tracking</li>
            <li>Room/location mapping</li>
            <li>Requirements gathering and fulfillment</li>
            <li>Comprehensive action logging</li>
            <li>Post-convention archiving</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionsList;
