import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Convention } from '@/types/convention';
import { Link } from '@/components/ui/Link'; // Ensure accessible link rendering
import { Search, Calendar, Archive, ArrowRightIcon, Info } from 'lucide-react'; // Added icons
import { Badge } from '@/components/ui/badge'; // Import Badge

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
        .eq('status', 'archived') // Fetch only archived conventions
        .order('start_date', { ascending: false });

      if (error) throw error;

      setConventions(data as Convention[]);
    } catch (error: any) {
      console.error('Error loading archived conventions:', error);
      toast({
        title: 'Error loading archive',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConventions();
  }, [currentAssociation]); // Removed fetchConventions from dependency array

  // Generate a list of unique years from conventions
  const getYears = (): string[] => {
    const years = new Set(
      conventions.map(c => new Date(c.start_date).getFullYear().toString())
    );
    return ['all', ...Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))];
  };

  // Filter conventions by search term and year
  const filteredConventions = conventions.filter(convention => {
    const matchesSearch = convention.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (convention.description && convention.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = yearFilter === 'all' || new Date(convention.start_date).getFullYear().toString() === yearFilter;
    return matchesSearch && matchesYear;
  });

  const years = getYears(); // Get years after fetching conventions

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added padding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convention Archive</h1>
          <p className="text-muted-foreground">
            Browse past events that have been archived.
          </p>
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search archived conventions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full" // Added padding for icon
              aria-label="Search archived conventions"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by year">
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredConventions.length === 0 ? (
        <Card className="mt-6 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Info className="h-5 w-5" /> No Archived Conventions Found
            </CardTitle>
            <CardDescription>
              {searchTerm || yearFilter !== 'all'
                ? 'No archived conventions match your current filters.'
                : 'There are no archived conventions yet.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Optional: Add a button to go back or clear filters */}
            {(searchTerm || yearFilter !== 'all') && (
              <Button variant="outline" onClick={() => { setSearchTerm(''); setYearFilter('all'); }}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConventions.map((convention) => (
            <Card key={convention.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-semibold leading-tight flex-1 mr-2">{convention.name}</CardTitle>
                  <Badge variant="outline" className="bg-muted text-muted-foreground whitespace-nowrap">
                    <Archive className="mr-1 h-3 w-3" /> Archived
                  </Badge>
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
              <div className="flex justify-end items-center p-4 border-t">
                <Button variant="outline" asChild size="sm">
                  <Link to={`/conventions/${convention.id}`}>
                    View Details
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {/* Add Unarchive functionality if needed */}
                {/* <Button variant="ghost" size="sm">Unarchive</Button> */}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConventionArchive;
