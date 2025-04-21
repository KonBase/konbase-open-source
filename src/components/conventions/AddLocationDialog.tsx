import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ConventionLocationFormData } from '@/types/convention';

interface AddLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conventionId: string;
  onLocationAdded: () => void;
}

const locationSchema = z.object({
  name: z.string().min(2, { message: "Location name must be at least 2 characters" }),
  description: z.string().nullable().optional(),
  type: z.string().min(1, { message: "Please select a location type" }),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  floor: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
});

export const AddLocationDialog: React.FC<AddLocationDialogProps> = ({
  isOpen,
  onClose,
  conventionId,
  onLocationAdded,
}) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'room',
      capacity: null,
      floor: '',
      building: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof locationSchema>) => {
    if (!conventionId) {
      toast({
        title: "Error",
        description: "Convention ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('convention_locations').insert({
        convention_id: conventionId,
        name: values.name,
        description: values.description || null,
        type: values.type,
        capacity: values.capacity,
        floor: values.floor || null,
        building: values.building || null,
      });

      if (error) throw error;

      toast({
        title: "Location added",
        description: `${values.name} has been added successfully`,
      });

      form.reset();
      onLocationAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding location:", error);
      toast({
        title: "Error adding location",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Add a new room or area to your convention.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Hall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the location" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="hall">Hall</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="booth">Booth</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value === null ? '' : field.value} />
                    </FormControl>
                    <FormDescription>Maximum number of people</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <Input placeholder="Building A" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input placeholder="1st Floor" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Location</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
