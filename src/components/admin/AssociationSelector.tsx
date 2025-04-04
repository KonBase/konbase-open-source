
import { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Association } from '@/types';
import { Check, ChevronsUpDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AssociationSelector() {
  const { currentAssociation, setCurrentAssociation, userAssociations } = useAssociation();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [adminAssociations, setAdminAssociations] = useState<Association[]>([]);
  
  useEffect(() => {
    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
      fetchAdminAssociations();
    }
  }, [profile]);
  
  const fetchAdminAssociations = async () => {
    try {
      const { data: associations, error } = await supabase
        .from('associations')
        .select('*');
        
      if (error) throw error;
      
      if (associations) {
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
        })).filter(
          // Filter out associations the user already has access to
          assoc => !userAssociations.some(userAssoc => userAssoc.id === assoc.id)
        );
        
        setAdminAssociations(formattedAssociations);
      }
    } catch (error) {
      console.error('Error fetching admin associations:', error);
    }
  };
  
  // Combine user associations and admin associations for super admins/admins
  const displayedAssociations = profile?.role === 'super_admin' || profile?.role === 'admin' 
    ? [...userAssociations, ...adminAssociations] 
    : userAssociations;
    
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  
  if (!currentAssociation && displayedAssociations.length === 0) {
    return null; // Nothing to display
  }
  
  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] md:w-[220px] justify-between"
          >
            {currentAssociation
              ? currentAssociation.name
              : "Select Association..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search association..." />
            <CommandEmpty>No association found.</CommandEmpty>
            <ScrollArea className="h-[300px]">
              <CommandGroup>
                {displayedAssociations.map((association) => (
                  <CommandItem
                    key={association.id}
                    onSelect={() => {
                      setCurrentAssociation(association);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">
                      {association.name}
                      {!userAssociations.some(a => a.id === association.id) && isAdmin && (
                        <span className="ml-2 text-xs text-muted-foreground">(Admin)</span>
                      )}
                    </span>
                    {currentAssociation?.id === association.id && (
                      <Check className="ml-2 h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
      
      {currentAssociation && isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9"
        >
          <Link to={`/association/profile?id=${currentAssociation.id}`} title="Manage Association">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
