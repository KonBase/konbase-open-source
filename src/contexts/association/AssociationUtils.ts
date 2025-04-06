
import { supabase } from '@/lib/supabase';
import { Association } from '@/types/association';
import { toast } from '@/components/ui/use-toast';
import { createAssociation as createAssociationHelper } from '@/lib/supabase-helpers';

/**
 * Format an association from database response
 */
export const formatAssociation = (association: any): Association => ({
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
});

/**
 * Fetch an association by ID
 */
export const fetchAssociationById = async (id: string): Promise<Association | null> => {
  try {
    const { data: association, error } = await supabase
      .from('associations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return association ? formatAssociation(association) : null;
  } catch (error) {
    console.error("Error fetching association:", error);
    return null;
  }
};

/**
 * Fetch user's associations
 */
export const fetchUserAssociations = async (profileId: string): Promise<Association[]> => {
  try {
    // First check if user has a primary association
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('association_id')
      .eq('id', profileId)
      .single();
    
    if (profileError) throw profileError;
    
    if (profile?.association_id) {
      const association = await fetchAssociationById(profile.association_id);
      return association ? [association] : [];
    }
    
    // If no primary association, check for memberships
    const { data: memberships, error } = await supabase
      .from('association_members')
      .select('association_id')
      .eq('user_id', profileId);
    
    if (error) throw error;
    
    if (memberships && memberships.length > 0) {
      const associationIds = memberships.map(m => m.association_id);
      
      const { data: associations, error: associationsError } = await supabase
        .from('associations')
        .select('*')
        .in('id', associationIds);
        
      if (associationsError) throw associationsError;
      
      if (associations && associations.length > 0) {
        return associations.map(formatAssociation);
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching user associations:", error);
    return [];
  }
};

/**
 * Create a new association
 */
export const createAssociation = async (
  data: Partial<Association>,
  profileId: string,
  profileEmail: string
): Promise<Association | null> => {
  try {
    const id = crypto.randomUUID();
    
    const now = new Date().toISOString();
    const dbData = {
      id,
      name: data.name || 'New Association',
      description: data.description,
      logo: data.logo,
      address: data.address,
      contact_email: data.contactEmail || profileEmail,
      contact_phone: data.contactPhone,
      website: data.website,
      created_at: now,
      updated_at: now
    };
    
    const { data: association, error } = await createAssociationHelper(dbData);
      
    if (error) throw error;
    
    if (association) {
      return formatAssociation(association);
    }
    
    return null;
  } catch (error) {
    console.error("Error creating association:", error);
    throw error;
  }
};

/**
 * Update an association
 */
export const updateAssociation = async (
  associationId: string,
  data: Partial<Association>
): Promise<void> => {
  try {
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
      .eq('id', associationId);
      
    if (error) throw error;
  } catch (error) {
    console.error("Error updating association:", error);
    throw error;
  }
};
