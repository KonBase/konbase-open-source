
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ConventionForm from './ConventionForm';
import { ConventionFormData } from '@/types/convention';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const CreateConventionDialog = ({ onConventionCreated }: { onConventionCreated?: () => void }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { currentAssociation } = useAssociation();

  const handleCreateConvention = async (data: ConventionFormData) => {
    if (!currentAssociation) {
      toast({
        title: "Error",
        description: "No association selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.from('conventions').insert({
        name: data.name,
        description: data.description || null,
        start_date: format(data.start_date, 'yyyy-MM-dd\'T\'HH:mm:ssXXX'),
        end_date: format(data.end_date, 'yyyy-MM-dd\'T\'HH:mm:ssXXX'),
        location: data.location || null,
        association_id: currentAssociation.id,
        status: 'planned'
      });
      
      if (error) throw error;
      
      toast({
        title: "Convention created",
        description: `${data.name} has been created successfully.`
      });
      
      setIsOpen(false);
      if (onConventionCreated) onConventionCreated();
      
    } catch (error: any) {
      console.error("Error creating convention:", error);
      toast({
        title: "Error creating convention",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Convention
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Convention</DialogTitle>
          <DialogDescription>
            Enter the details for your new convention.
          </DialogDescription>
        </DialogHeader>
        <ConventionForm onSubmit={handleCreateConvention} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateConventionDialog;
