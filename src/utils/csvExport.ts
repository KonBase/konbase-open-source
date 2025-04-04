
import { Association } from '@/types/association';
import { supabase } from '@/lib/supabase';

/**
 * Convert association data to CSV format
 */
export const associationToCSV = async (associationId: string): Promise<string> => {
  try {
    // Fetch association data
    const { data: association, error: associationError } = await supabase
      .from('associations')
      .select('*')
      .eq('id', associationId)
      .single();
    
    if (associationError) throw associationError;
    
    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('association_id', associationId);
    
    if (categoriesError) throw categoriesError;
    
    // Fetch locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('association_id', associationId);
    
    if (locationsError) throw locationsError;
    
    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('association_id', associationId);
    
    if (itemsError) throw itemsError;
    
    // Create CSV content
    let csv = '';
    
    // Association info
    csv += 'ASSOCIATION\n';
    csv += 'id,name,description,contact_email,contact_phone,website,address\n';
    csv += `${association.id},"${escapeCSV(association.name)}","${escapeCSV(association.description || '')}",`;
    csv += `"${escapeCSV(association.contact_email)}","${escapeCSV(association.contact_phone || '')}",`;
    csv += `"${escapeCSV(association.website || '')}","${escapeCSV(association.address || '')}"\n\n`;
    
    // Categories
    csv += 'CATEGORIES\n';
    csv += 'id,name,description,parent_id\n';
    
    categories.forEach(cat => {
      csv += `${cat.id},"${escapeCSV(cat.name)}","${escapeCSV(cat.description || '')}",${cat.parent_id || ''}\n`;
    });
    
    csv += '\n';
    
    // Locations
    csv += 'LOCATIONS\n';
    csv += 'id,name,description,parent_id,is_room\n';
    
    locations.forEach(loc => {
      csv += `${loc.id},"${escapeCSV(loc.name)}","${escapeCSV(loc.description || '')}",`;
      csv += `${loc.parent_id || ''},${loc.is_room}\n`;
    });
    
    csv += '\n';
    
    // Items
    csv += 'ITEMS\n';
    csv += 'id,name,description,serial_number,barcode,condition,category_id,location_id,purchase_date,';
    csv += 'purchase_price,warranty_expiration,is_consumable,quantity,minimum_quantity,notes\n';
    
    items.forEach(item => {
      csv += `${item.id},"${escapeCSV(item.name)}","${escapeCSV(item.description || '')}",`;
      csv += `"${escapeCSV(item.serial_number || '')}","${escapeCSV(item.barcode || '')}","${item.condition}",`;
      csv += `${item.category_id},${item.location_id},"${item.purchase_date || ''}",`;
      csv += `${item.purchase_price || ''},"${item.warranty_expiration || ''}",${item.is_consumable},`;
      csv += `${item.quantity || '1'},"${item.minimum_quantity || ''}","${escapeCSV(item.notes || '')}"\n`;
    });
    
    return csv;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
};

/**
 * Generate CSV template for association import
 */
export const generateCSVTemplate = (): string => {
  let template = '';
  
  // Categories template
  template += 'CATEGORIES\n';
  template += 'name,description,parent_name\n';
  template += 'Main Category,Description of main category,\n';
  template += 'Sub Category,Description of sub category,Main Category\n\n';
  
  // Locations template
  template += 'LOCATIONS\n';
  template += 'name,description,parent_name,is_room\n';
  template += 'Main Storage,Main storage area,,FALSE\n';
  template += 'Storage Room 1,First storage room,Main Storage,TRUE\n\n';
  
  // Items template
  template += 'ITEMS\n';
  template += 'name,description,serial_number,barcode,condition,category_name,location_name,';
  template += 'purchase_date,purchase_price,warranty_expiration,is_consumable,quantity,minimum_quantity,notes\n';
  template += 'Item Name,Item description,SN12345,BC12345,new,Main Category,Main Storage,';
  template += '2023-01-01,99.99,2025-01-01,FALSE,1,,,\n';
  template += 'Consumable Item,Consumable description,,,good,Sub Category,Storage Room 1,';
  template += '2023-01-01,19.99,,TRUE,100,20,Reorder when low\n';
  
  return template;
};

/**
 * Escape CSV values to handle quotes and special characters
 */
const escapeCSV = (value: string): string => {
  if (!value) return '';
  return value.replace(/"/g, '""');
};

/**
 * Download data as CSV file
 */
export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
