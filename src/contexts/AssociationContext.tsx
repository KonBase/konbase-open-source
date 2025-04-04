
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Association } from '../types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface AssociationContextType {
  currentAssociation: Association | null;
  isLoading: boolean;
  setCurrentAssociation: (association: Association | null) => void;
  updateAssociation: (data: Partial<Association>) => Promise<void>;
  createAssociation: (data: Partial<Association>) => Promise<Association | null>;
  userAssociations: Association[];
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export const useAssociation = () => {
  const context = useContext(AssociationContext);
  if (!context) {
    throw new Error('useAssociation must be used within an AssociationProvider');
  }
  return context;
};

export const AssociationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null);
  const [userAssociations, setUserAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useUserProfile();

  useEffect(() => {
    const loadAssociations = async () => {
      if (!profile) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // First get all associations this user is a member of
        let { data: memberships, error: membershipError } = await supabase
          .from('association_members')
          .select('association_id')
          .eq('user_id', profile.id);

        if (membershipError) throw membershipError;
        
        const associationIds = memberships?.map(m => m.association_id) || [];
        
        if (associationIds.length > 0) {
          // Get detailed information about each association
          const { data: associations, error: associationsError } = await supabase
            .from('associations')
            .select('*')
            .in('id', associationIds);
            
          if (associationsError) throw associationsError;
          
          if (associations && associations.length > 0) {
            setUserAssociations(associations.map(a => ({
              id: a.id,
              name: a.name,
              description: a.description || undefined,
              logo: a.logo || undefined,
              address: a.address || undefined,
              contactEmail: a.contact_email,
              contactPhone: a.contact_phone || undefined,
              website: a.website || undefined,
              createdAt: a.created_at,
              updatedAt: a.updated_at
            })));
            
            // Set the first association as current if none is selected
            if (!currentAssociation) {
              setCurrentAssociation({
                id: associations[0].id,
                name: associations[0].name,
                description: associations[0].description || undefined,
                logo: associations[0].logo || undefined,
                address: associations[0].address || undefined,
                contactEmail: associations[0].contact_email,
                contactPhone: associations[0].contact_phone || undefined,
                website: associations[0].website || undefined,
                createdAt: associations[0].created_at,
                updatedAt: associations[0].updated_at
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading associations:", error);
        toast({
          title: "Error",
          description: "Failed to load your associations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAssociations();
  }, [profile]);

  const updateAssociation = async (data: Partial<Association>) => {
    setIsLoading(true);
    try {
      if (!currentAssociation) throw new Error("No association selected");
      
      // Convert to snake_case for database
      const dbData = {
        name: data.name,
        description: data.description,
        logo: data.logo,
        address: data.address,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        website: data.website,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('associations')
        .update(dbData)
        .eq('id', currentAssociation.id);
        
      if (error) throw error;
      
      const updatedAssociation = {
        ...currentAssociation,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      setCurrentAssociation(updatedAssociation);
      
      // Also update in the list of user associations
      setUserAssociations(prev => 
        prev.map(assoc => 
          assoc.id === currentAssociation.id 
            ? updatedAssociation 
            : assoc
        )
      );
      
      toast({
        title: "Association updated",
        description: "Association details have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating association:", error);
      toast({
        title: "Error updating association",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createAssociation = async (data: Partial<Association>): Promise<Association | null> => {
    setIsLoading(true);
    try {
      if (!profile) throw new Error("You must be logged in to create an association");
      
      // Convert to snake_case for database
      const now = new Date().toISOString();
      const dbData = {
        name: data.name || 'New Association',
        description: data.description,
        logo: data.logo,
        address: data.address,
        contact_email: data.contactEmail || profile.email,
        contact_phone: data.contactPhone,
        website: data.website,
        created_at: now,
        updated_at: now
      };
      
      // Insert new association
      const { data: newAssociation, error } = await supabase
        .from('associations')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      if (!newAssociation) throw new Error("Failed to create association");
      
      // Make the user a member (and admin) of the new association
      await supabase
        .from('association_members')
        .insert({
          association_id: newAssociation.id,
          user_id: profile.id,
          role: 'admin',
          created_at: now,
          updated_at: now
        });
      
      // Format the association for our app
      const formattedAssociation: Association = {
        id: newAssociation.id,
        name: newAssociation.name,
        description: newAssociation.description || undefined,
        logo: newAssociation.logo || undefined,
        address: newAssociation.address || undefined,
        contactEmail: newAssociation.contact_email,
        contactPhone: newAssociation.contact_phone || undefined,
        website: newAssociation.website || undefined,
        createdAt: newAssociation.created_at,
        updatedAt: newAssociation.updated_at
      };
      
      // Add to user associations
      setUserAssociations(prev => [...prev, formattedAssociation]);
      
      // Set as current association
      setCurrentAssociation(formattedAssociation);
      
      toast({
        title: "Association created",
        description: `${formattedAssociation.name} has been created successfully.`,
      });
      
      return formattedAssociation;
    } catch (error: any) {
      console.error("Error creating association:", error);
      toast({
        title: "Error creating association",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AssociationContext.Provider
      value={{
        currentAssociation,
        isLoading,
        setCurrentAssociation,
        updateAssociation,
        createAssociation,
        userAssociations
      }}
    >
      {children}
    </AssociationContext.Provider>
  );
};
