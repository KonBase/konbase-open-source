import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterIcon, DownloadIcon, SearchIcon, CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionLog } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { exportToCSV } from '@/utils/csvExport';

const ConventionLogs = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [logs, setLogs] = useState<ConventionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_logs')
        .select(`
          *,
          users:user_id(id, email, display_name)
        `)
        .eq('convention_id', conventionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast({
        title: 'Error loading logs',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
  }, [conventionId, currentAssociation]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge variant="default">Create</Badge>;
      case 'update':
        return <Badge variant="outline">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'equipment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Equipment</Badge>;
      case 'consumable':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Consumable</Badge>;
      case 'requirement':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Requirement</Badge>;
      case 'location':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Location</Badge>;
      case 'convention':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Convention</Badge>;
      default:
        return <Badge variant="outline">{entityType}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.users?.display_name?.toLowerCase().includes(searchLower) ||
      log.users?.email?.toLowerCase().includes(searchLower) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
    );
  });

  const exportLogs = () => {
    try {
      const data = filteredLogs.map(log => ({
        Date: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        User: log.users?.display_name || log.users?.email || log.user_id,
        Action: log.action,
        EntityType: log.entity_type,
        Details: JSON.stringify(log.details || {})
      }));
      
      exportToCSV(data, `convention-logs-${conventionId}-${format(new Date(), 'yyyy-MM-dd')}`);
      
      toast({
        title: 'Logs exported',
        description: 'Convention logs have been exported to CSV successfully',
      });
    } catch (error: any) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Error exporting logs',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Track all actions and changes during conventions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Convention Activity Logs</CardTitle>
          <CardDescription>History of all actions taken during this convention</CardDescription>
          <div className="relative mt-2">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Logs Found</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm ? 'No logs match your search criteria.' : 'No activity logs have been recorded yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {log.users?.display_name || log.users?.email || log.user_id}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details ? (
                        <span title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details).substring(0, 50)}
                          {JSON.stringify(log.details).length > 50 ? '...' : ''}
                        </span>
                      ) : (
                        'No details'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionLogs;
