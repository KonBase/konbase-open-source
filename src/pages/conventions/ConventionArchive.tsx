import React, { useEffect, useState } from 'react';
import { Link } from '@/components/ui/Link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArchiveIcon, SearchIcon, CalendarIcon, ClockIcon, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { Convention } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ConventionArchive = () => {
  const { currentAssociation } = useAssociation();
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchConventions = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .in('status', ['completed', 'archived'])
        .order('end_date', { ascending: false });
      
      if (error) throw error;
      
      setConventions(data as Convention[]);
    } catch (error: any) {
      console.error('Error loading archived conventions:', error);
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

  // Generate a list of years from conventions
  const getYears = (): string[] => {
    const years = new Set<string>();
    conventions.forEach(convention => {
      const year = format(parseISO(convention.end_date), 'yyyy');
      years.add(year);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
  };

  // Filter conventions by search term and year
  const filteredConventions = conventions.filter(convention => {
    const matchesSearch = searchTerm === '' || 
      convention.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (convention.location && convention.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesYear = yearFilter === 'all' || 
      format(parseISO(convention.end_date), 'yyyy') === yearFilter;
    
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Archive</h1>
          <p className="text-muted-foreground">Access and manage past conventions.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Archived Conventions</CardTitle>
          <CardDescription>Browse all completed conventions</CardDescription>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conventions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={yearFilter}
                onValueChange={setYearFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getYears().map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading archives...</p>
            </div>
          ) : filteredConventions.length === 0 ? (
            <div className="text-center py-10">
              <ArchiveIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Archived Conventions</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || yearFilter !== 'all' 
                  ? 'No conventions match your search criteria.'
                  : 'No completed or archived conventions found.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConventions.map((convention) => (
                  <TableRow key={convention.id}>
                    <TableCell className="font-medium">{convention.name}</TableCell>
                    <TableCell>
                      {format(parseISO(convention.start_date), 'MMM d')} - {format(parseISO(convention.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{convention.location || 'No location'}</TableCell>
                    <TableCell>
                      <Badge variant={convention.status === 'archived' ? 'outline' : 'secondary'}>
                        {convention.status.charAt(0).toUpperCase() + convention.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/conventions/${convention.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Archive Management</CardTitle>
          <CardDescription>About archiving conventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Archived conventions are read-only and can be used for reference purposes.
              Convention archives include all equipment records, consumable usage,
              and activity logs from completed events.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Completed Conventions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conventions marked as "completed" are finished but still editable.
                </p>
              </div>
              <div className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArchiveIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Archived Conventions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Archived conventions are locked and read-only to preserve records.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionArchive;
