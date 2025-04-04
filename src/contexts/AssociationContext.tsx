
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
        // Get user's association directly from the profile
        if (profile.association_id) {
          // Get detailed information about the association
          const { data: association, error } = await supabase
            .from('associations')
            .select('*')
            .eq('id', profile.association_id)
            .single();
            
          if (error) throw error;
          
          if (association) {
            const formattedAssociation: Association = {
              id: association.id,
              name: association.name,
              description: association.description || undefined,
              logo: association.logo || undefined,
              address: association.address || undefined,
              contactEmail: association.contact_email,
              contactPhone: association.contact_phone || undefined,
              website: association.website || undefined,
              createdAt: association.created_at,
              updatedAt: association.updated_at
            };
            
            setUserAssociations([formattedAssociation]);
            setCurrentAssociation(formattedAssociation);
          }
        } else {
          // Check association_members table as an alternative
          const { data: memberships, error } = await supabase
            .from('association_members')
            .select('association_id')
            .eq('user_id', profile.id);
          
          if (error) throw error;
          
          if (memberships && memberships.length > 0) {
            const associationIds = memberships.map(m => m.association_id);
            
            // Get information about each association
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
          } else {
            setUserAssociations([]);
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
      
      // Add the user as a member in the association_members table
      await supabase
        .from('association_members')
        .insert({
          user_id: profile.id,
          association_id: id,
          role: 'admin', // Make the creator an admin
        });
      
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
