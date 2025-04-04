
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
        // Get all associations this user belongs to (approach modified to work with available tables)
        const { data: userAssocs, error } = await supabase
          .from('users')
          .select('association_id')
          .eq('id', profile.id)
          .not('association_id', 'is', null);
        
        if (error) throw error;
        
        // If user has no associations, exit early
        if (!userAssocs || userAssocs.length === 0) {
          setUserAssociations([]);
          setIsLoading(false);
          return;
        }
        
        // Get the association IDs
        const associationIds = userAssocs
          .filter(assoc => assoc.association_id) // Filter out null values
          .map(assoc => assoc.association_id as string);
        
        if (associationIds.length > 0) {
          // Get detailed information about each association
          const { data: associations, error: associationsError } = await supabase
            .from('associations')
            .select('*')
            .in('id', associationIds);
            
          if (associationsError) throw associationsError;
          
          if (associations && associations.length > 0) {
            const formattedAssociations = associations.map(a => ({
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
            }));
            
            setUserAssociations(formattedAssociations);
            
            // Set the first association as current if none is selected
            if (!currentAssociation && formattedAssociations.length > 0) {
              setCurrentAssociation(formattedAssociations[0]);
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
  }, [profile, currentAssociation]);

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
      
      // Generate UUID for new association
      const id = crypto.randomUUID();
      
      // Convert to snake_case for database
      const now = new Date().toISOString();
      const dbData = {
        id,
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
      const { error } = await supabase
        .from('associations')
        .insert(dbData);
        
      if (error) throw error;
      
      // Update the user's association_id in the profiles table
      await supabase
        .from('users')
        .update({ association_id: id })
        .eq('id', profile.id);
      
      // Format the association for our app
      const formattedAssociation: Association = {
        id: dbData.id,
        name: dbData.name,
        description: dbData.description || undefined,
        logo: dbData.logo || undefined,
        address: dbData.address || undefined,
        contactEmail: dbData.contact_email,
        contactPhone: dbData.contact_phone || undefined,
        website: dbData.website || undefined,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at
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
