
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/debug';

const AssociationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    website: '',
    address: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateAssociation = async () => {
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the association
      const { data, error } = await supabase
        .from('associations')
        .insert({
          name: formData.name,
          description: formData.description,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          website: formData.website,
          address: formData.address
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the current user as an admin for this association
      const memberResult = await supabase
        .from('association_members')
        .insert({
          user_id: user?.id,
          association_id: data.id,
          role: 'admin'
        });
      
      if (memberResult.error) throw memberResult.error;
      
      // Update user profile with the association ID and promote from guest to admin
      const profileResult = await supabase
        .from('profiles')
        .update({ 
          association_id: data.id,
          role: 'admin'
        })
        .eq('id', user?.id);
      
      if (profileResult.error) throw profileResult.error;
      
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        entity: 'associations',
        entity_id: data.id,
        action: 'create',
        changes: `Created association "${data.name}"`
      });
      
      toast({
        title: 'Association Created',
        description: `${data.name} has been created successfully`
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'AssociationForm.handleCreateAssociation');
      toast({
        title: 'Failed to Create Association',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Association Name*</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="E.g., Springfield Gaming Association"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Brief description of your organization"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email*</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleInputChange}
            placeholder="contact@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            placeholder="(123) 456-7890"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="https://www.example.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Physical address of your organization"
          rows={2}
        />
      </div>
      
      <Button 
        className="w-full" 
        onClick={handleCreateAssociation}
        disabled={isCreating}
      >
        {isCreating ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create Association
          </>
        )}
      </Button>
    </form>
  );
};

export default AssociationForm;
