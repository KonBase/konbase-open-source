
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Convention } from '@/types/convention';
import { Calendar, ArchiveIcon, ArrowRightIcon } from 'lucide-react';
import CreateConventionDialog from '@/components/conventions/CreateConventionDialog';
import { Link } from '@/components/ui/Link';
import ArchiveConventionDialog from '@/components/conventions/ArchiveConventionDialog';
import { Badge } from '@/components/ui/badge';

const ConventionsList = () => {
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchConventions = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setConventions(data as Convention[]);
    } catch (error: any) {
      console.error('Error loading conventions:', error);
      toast({
        title: 'Error loading conventions',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConventions();
  }, [currentAssociation]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline">Planned</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (associationLoading || isLoading) {
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
            <Button asChild>
              <Link href="/association">Go to Associations</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Conventions</h1>
          <p className="text-muted-foreground">
            Manage your events and track equipment usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateConventionDialog onConventionCreated={fetchConventions} />
        </div>
      </div>
      
      {conventions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Conventions Found</CardTitle>
            <CardDescription>
              Create your first convention to start tracking equipment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CreateConventionDialog onConventionCreated={fetchConventions} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conventions.map((convention) => (
            <Card key={convention.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{convention.name}</CardTitle>
                  {getStatusBadge(convention.status)}
                </div>
                <CardDescription>
                  {new Date(convention.start_date).toLocaleDateString()} - {new Date(convention.end_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-2">
                  {convention.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" asChild size="sm">
                    <Link href={`/conventions/${convention.id}`}>
                      View Details
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <ArchiveConventionDialog 
                    convention={convention} 
                    onArchived={fetchConventions} 
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={convention.status === 'archived'}
                      >
                        <ArchiveIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConventionsList;
