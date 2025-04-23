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
import { Calendar, ArchiveIcon, ArrowRightIcon, Clock, CheckCircle, Archive } from 'lucide-react';
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
        return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300"><Clock className="mr-1 h-3 w-3" /> Planned</Badge>;
      case 'active':
        return <Badge variant="default"><Calendar className="mr-1 h-3 w-3" /> Active</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><Archive className="mr-1 h-3 w-3" /> Archived</Badge>;
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
              <Link to="/association">Go to Associations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Conventions</h1>
          <p className="text-muted-foreground">
            Manage your association's events and track related resources.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateConventionDialog onConventionCreated={fetchConventions} />
        </div>
      </div>
      
      {conventions.length === 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Active Conventions</CardTitle>
            <CardDescription>
              Create your first convention to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center flex-col gap-4 pt-4">
             <Calendar size={48} className="text-muted-foreground" />
            <CreateConventionDialog onConventionCreated={fetchConventions} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300">
          {conventions.map((convention) => (
            <Card key={convention.id} className="hover:shadow-md transition-shadow duration-200 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-semibold leading-tight flex-1 mr-2">{convention.name}</CardTitle>
                  {getStatusBadge(convention.status)}
                </div>
                <CardDescription className="flex items-center text-sm pt-1">
                  <Calendar className="mr-1.5 h-4 w-4 text-muted-foreground" />
                  {new Date(convention.start_date).toLocaleDateString()} - {new Date(convention.end_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-4">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {convention.description || 'No description provided.'}
                </p>
              </CardContent>
              <div className="flex justify-between items-center p-4 border-t">
                <Button variant="default" asChild size="sm">
                  <Link to={`/conventions/${convention.id}`}>
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
                      size="icon"
                      disabled={convention.status === 'archived'}
                      aria-label="Archive convention"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </Button>
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConventionsList;
