import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ClipboardIcon, CheckCircleIcon, XCircleIcon, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionRequirement } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AddRequirementDialog } from '@/components/conventions/AddRequirementDialog';

const ConventionRequirements = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [requirements, setRequirements] = useState<ConventionRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddRequirementOpen, setIsAddRequirementOpen] = useState(false);
  const { toast } = useToast();

  const fetchRequirements = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {      const { data, error } = await supabase
        .from('convention_requirements')
        .select(`
          *,
          requestor:requested_by(id, email, display_name),
          approver:approved_by(id, email, display_name)
        `)
        .eq('convention_id', conventionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include joined fields
      const transformedData = data?.map(item => ({
        ...item,
        requestor: item.requestor,
        approver: item.approver
      })) || [];
      
      setRequirements(transformedData);
    } catch (error: any) {
      console.error('Error loading requirements:', error);
      toast({
        title: 'Error loading requirements',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequirements();
  }, [conventionId, currentAssociation]);

  const handleRequirementAdded = () => {
    fetchRequirements();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Requested</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Denied</Badge>;
      case 'fulfilled':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Fulfilled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Count requirements by status
  const statusCounts = {
    requested: requirements.filter(r => r.status === 'requested').length,
    approved: requirements.filter(r => r.status === 'approved').length,
    denied: requirements.filter(r => r.status === 'denied').length,
    fulfilled: requirements.filter(r => r.status === 'fulfilled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requirements Management</h1>
          <p className="text-muted-foreground">Track and manage equipment and resource requirements for your convention.</p>
        </div>
        <Button onClick={() => setIsAddRequirementOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requested</CardTitle>
            <ClipboardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.requested}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.approved}</div>
            <p className="text-xs text-muted-foreground">Ready to fulfill</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.fulfilled}</div>
            <p className="text-xs text-muted-foreground">Completed requirements</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Requirements</CardTitle>
          <CardDescription>Equipment and resource requirements for this convention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading requirements...</p>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Requirements</h3>
              <p className="mt-1 text-muted-foreground">
                No requirements have been added to this convention yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddRequirementOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Requirement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-medium">{requirement.name}</TableCell>
                    <TableCell>{getStatusBadge(requirement.status)}</TableCell>
                    <TableCell>{getPriorityBadge(requirement.priority)}</TableCell>
                    <TableCell>
                      {requirement.requestor?.display_name || requirement.requestor?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(requirement.requested_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddRequirementDialog 
        isOpen={isAddRequirementOpen} 
        onClose={() => setIsAddRequirementOpen(false)} 
        conventionId={conventionId || ''} 
        onRequirementAdded={handleRequirementAdded}
      />
    </div>
  );
};

export default ConventionRequirements;
