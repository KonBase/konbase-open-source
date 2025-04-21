import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ClipboardIcon, Copy, CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionTemplate } from '@/types/convention';
import { format } from 'date-fns';
import { AddTemplateDialog } from '@/components/conventions/AddTemplateDialog';
import { useNavigate } from 'react-router-dom';

const ConventionTemplates = () => {
  const { currentAssociation } = useAssociation();
  const [templates, setTemplates] = useState<ConventionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_templates')
        .select(`
          *,
          creator:created_by(email, display_name)
        `)
        .eq('association_id', currentAssociation.id)
        .order('name');
      
      if (error) throw error;
      
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error loading templates',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, [currentAssociation]);

  const handleTemplateAdded = () => {
    fetchTemplates();
  };

  const useTemplate = (templateId: string) => {
    // Navigate to the create convention page with template ID
    navigate(`/conventions/create?template=${templateId}`);
  };

  const formatConfigurationSummary = (config: Record<string, any>) => {
    const items = [];
    if (config.locations) items.push(`${config.locations.length} locations`);
    if (config.equipment) items.push(`${config.equipment.length} equipment items`);
    if (config.consumables) items.push(`${config.consumables.length} consumables`);
    if (config.requirements) items.push(`${config.requirements.length} requirements`);
    
    return items.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Templates</h1>
          <p className="text-muted-foreground">Create and manage templates for quick convention setup.</p>
        </div>
        <Button onClick={() => setIsAddTemplateOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>Reusable configurations for quick convention setup</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Templates</h3>
              <p className="mt-1 text-muted-foreground">
                You haven't created any convention templates yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddTemplateOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Created:</strong> {format(new Date(template.created_at), 'MMM d, yyyy')}</p>
                      <p><strong>By:</strong> {template.creator?.display_name || template.creator?.email || 'Unknown'}</p>
                      <p className="mt-1 font-medium">Includes:</p>
                      <p>{formatConfigurationSummary(template.configuration)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => useTemplate(template.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About Templates</CardTitle>
          <CardDescription>How to use convention templates effectively</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Convention templates help you quickly set up new conventions by reusing your most common configurations. 
              Templates can include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pre-defined locations (rooms, halls, etc.)</li>
              <li>Equipment lists with pre-allocated quantities</li>
              <li>Consumable requirements</li>
              <li>Standard requirements</li>
            </ul>
            <p>
              To use a template, simply click "Use Template" and it will pre-populate the convention creation form.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <AddTemplateDialog 
        isOpen={isAddTemplateOpen} 
        onClose={() => setIsAddTemplateOpen(false)} 
        onTemplateAdded={handleTemplateAdded}
      />
    </div>
  );
};

export default ConventionTemplates;
