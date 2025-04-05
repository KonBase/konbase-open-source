
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';

interface AssociationFormProps {
  onSuccess?: () => void;
}

const AssociationForm = ({ onSuccess }: AssociationFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { createAssociation } = useAssociation();
  const { user, userProfile } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Association name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!contactEmail.trim()) {
      toast({
        title: "Error",
        description: "Contact email is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the context method to create the association
      const newAssociation = await createAssociation({
        name: name.trim(),
        description: description.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        website: website.trim(),
        address: address.trim()
      });
      
      if (!newAssociation) {
        throw new Error("Failed to create association");
      }
      
      // Show success message
      toast({
        title: "Success",
        description: `${name} has been created successfully`,
      });
      
      // Call the onSuccess callback if provided
      onSuccess?.();
      
    } catch (error: any) {
      console.error("Error creating association:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create association",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Pre-fill contact email with user's email if available
  useState(() => {
    if (user?.email && contactEmail === '') {
      setContactEmail(user.email);
    }
  });
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Association Name</Label>
        <Input
          id="name"
          placeholder="Enter association name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your association"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contact@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            placeholder="Phone number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="Physical address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
          rows={2}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create Association'}
      </Button>
    </form>
  );
};

export default AssociationForm;
