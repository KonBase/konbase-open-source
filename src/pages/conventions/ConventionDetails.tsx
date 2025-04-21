import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Convention } from '@/types/convention';
import { format } from 'date-fns';
import { Link } from '@/components/ui/Link';

const ConventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [convention, setConvention] = useState<Convention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConvention = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch convention details
        const { data: conventionData, error } = await supabase
          .from('conventions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setConvention(conventionData);
        
        // Fetch equipment count
        const { count: equipCount, error: equipError } = await supabase
          .from('convention_equipment')
          .select('id', { count: 'exact', head: true })
          .eq('convention_id', id);
        
        if (equipError) throw equipError;
        setEquipmentCount(equipCount || 0);
        
        // Fetch staff count
        const { count: accessCount, error: accessError } = await supabase
          .from('convention_access')
          .select('id', { count: 'exact', head: true })
          .eq('convention_id', id);
        
        if (accessError) throw accessError;
        setStaffCount(accessCount || 0);
        
      } catch (error: any) {
        console.error('Error loading convention:', error);
        toast({
          title: 'Error loading convention',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConvention();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!convention) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Convention Not Found</CardTitle>
            <CardDescription>The requested convention could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/conventions">Back to Conventions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const startDate = new Date(convention.start_date);
  const endDate = new Date(convention.end_date);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{convention.name}</h1>
          <p className="text-muted-foreground">
            {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')} • {convention.location || 'No location set'}
          </p>
        </div>
        <Button>Edit Convention</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(startDate, 'MMM d')}-{format(endDate, 'MMM d')}</div>
            <p className="text-xs text-muted-foreground">{format(startDate, 'yyyy')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convention.location || 'Not set'}</div>
            <p className="text-xs text-muted-foreground">Convention location</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
            <p className="text-xs text-muted-foreground">Convention staff</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCount}</div>
            <p className="text-xs text-muted-foreground">Items assigned</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Convention Details</CardTitle>
          <CardDescription>Information about this convention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {convention.description || 'No description provided.'}
          </p>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Convention Status</h3>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
              {convention.status.charAt(0).toUpperCase() + convention.status.slice(1)}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Overview</CardTitle>
            <CardDescription>Summary of assigned equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/conventions/${convention.id}/equipment`}>
                  <Package className="mr-2 h-4 w-4" />
                  View Equipment
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/conventions/${convention.id}/consumables`}>
                  <Package className="mr-2 h-4 w-4" />
                  View Consumables
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Convention management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/conventions/${convention.id}/requirements`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Requirements
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/conventions/${convention.id}/locations`}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Locations
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/conventions/${convention.id}/logs`}>
                  <Users className="mr-2 h-4 w-4" />
                  View Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConventionDetails;
