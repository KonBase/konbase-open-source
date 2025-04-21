-- Create role types for user management
CREATE TYPE public.user_role_type AS ENUM (
  'super_admin',
  'system_admin',
  'admin',
  'manager',
  'member',
  'guest'
);

-- Profiles table for user data that links to Supabase Auth users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'guest',
  association_id UUID,
  profile_image TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Associations table for organization data
CREATE TABLE public.associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  address TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key to profiles table after associations table is created
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_association
  FOREIGN KEY (association_id) REFERENCES public.associations(id) ON DELETE SET NULL;

-- Association members linking users to associations
CREATE TABLE public.association_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, association_id)
);

-- Association invitations for new members
CREATE TABLE public.association_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Categories for inventory items
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Locations for inventory items
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  is_room BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  barcode TEXT,
  condition TEXT NOT NULL DEFAULT 'unknown',
  purchase_date TIMESTAMP WITH TIME ZONE,
  purchase_price NUMERIC,
  warranty_expiration TIMESTAMP WITH TIME ZONE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  is_consumable BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1,
  minimum_quantity INTEGER,
  image TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conventions (events)
CREATE TABLE public.conventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE, -- Optional: Link notification to an association
  message TEXT NOT NULL,
  type TEXT, -- Optional: e.g., 'invitation', 'item_update', 'system'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT, -- Optional: Link to relevant page/resource
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs for tracking important actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
  -- Two-factor auth data
  CREATE TABLE public.user_2fa (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    totp_secret TEXT NOT NULL,
    recovery_keys TEXT[] NOT NULL,
    used_recovery_keys TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Update RLS policies for user_2fa
  DROP POLICY IF EXISTS "Users can view their own 2FA data" ON public.user_2fa;
  DROP POLICY IF EXISTS "Users can update their own 2FA data" ON public.user_2fa;

  CREATE POLICY "Allow individual user access"
  ON public.user_2fa
  FOR ALL
  USING (auth.uid() = user_id);

  -- Helper functions for RLS policies --

  -- Create user profile when a new user signs up
  CREATE OR REPLACE FUNCTION public.create_profile_for_user()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  SECURITY DEFINER
  AS $
  BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    'guest'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile when user signs up (checking if it exists first)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user();
  END IF;
END
$$;

-- Update profile when user info changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to update profile when user changes (checking if it exists first)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_updated'
  ) THEN
    CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();
  END IF;
END
$$;

-- Check if user has elevated admin role
CREATE OR REPLACE FUNCTION public.has_elevated_admin_role(user_id uuid)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role IN ('system_admin', 'super_admin');
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Check if current user is system or super admin
CREATE OR REPLACE FUNCTION public.is_system_or_super_admin()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('system_admin', 'super_admin')
  );
END;
$$;

-- Check if current user is an admin or higher
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
  );
END;
$$;

-- Check if user is member of association
CREATE OR REPLACE FUNCTION public.is_member_of_association(user_id uuid, assoc_id uuid)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM association_members
    WHERE user_id = $1 AND association_id = $2
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in is_member_of_association: %', SQLERRM;
  RETURN false;
END;
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
EXCEPTION WHEN OTHERS THEN
  RETURN 'guest';
END;
$$;

-- Get user association memberships
CREATE OR REPLACE FUNCTION public.get_user_association_memberships(user_id_param uuid)
RETURNS TABLE(association_id uuid, association_name text, association_slug text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    am.association_id, 
    a.name as association_name, 
    a.slug as association_slug
  FROM 
    public.association_members am
  JOIN 
    public.associations a ON am.association_id = a.id
  WHERE 
    am.user_id = user_id_param;
$$;


-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY; -- Enable RLS for notifications

-- RLS Policies --

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "System & Super admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_system_or_super_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles in their association"
  ON public.profiles
  FOR UPDATE
  USING (
    is_admin() AND 
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = profiles.association_id
    )
  );

-- Association policies
CREATE POLICY "Users can view associations they are members of"
  ON public.associations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members
      WHERE user_id = auth.uid() AND association_id = associations.id
    )
  );

CREATE POLICY "Super admins can view all associations"
  ON public.associations
  FOR SELECT
  USING (is_system_or_super_admin());

-- Add a policy specifically for super_admins to manage ALL associations
CREATE POLICY "Super admins can manage all associations"
  ON public.associations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Add a policy specifically for system_admins to manage ALL associations
CREATE POLICY "System admins can manage all associations"
  ON public.associations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

CREATE POLICY "Admins can update their associations"
  ON public.associations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM association_members
      WHERE user_id = auth.uid() 
      AND association_id = associations.id
      AND role IN ('admin', 'system_admin', 'super_admin')
    )
  );

-- Fix the policy for creating associations to explicitly check for authenticated users
CREATE POLICY "Users can create associations"
  ON public.associations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Association members policies
CREATE POLICY "Members can view their association members"
  ON public.association_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = association_members.association_id
    )
  );

CREATE POLICY "Admins can manage association members"
  ON public.association_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = association_members.association_id
      AND p.role IN ('admin', 'system_admin', 'super_admin')
    )
  );

CREATE POLICY "Users can join associations with invitations"
  ON public.association_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Association invitations policies
CREATE POLICY "Admins can manage invitations"
  ON public.association_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = association_invitations.association_id
      AND p.role IN ('admin', 'system_admin', 'super_admin')
    )
  );

CREATE POLICY "All users can select invitations"
  ON public.association_invitations
  FOR SELECT
  USING (true);

-- Categories policies
CREATE POLICY "Members can view categories in their association"
  ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = categories.association_id
    )
  );

CREATE POLICY "Managers and admins can manage categories"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = categories.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- Locations policies
CREATE POLICY "Members can view locations in their association"
  ON public.locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = locations.association_id
    )
  );

CREATE POLICY "Managers and admins can manage locations"
  ON public.locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = locations.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- Items policies
CREATE POLICY "Members can view items in their association"
  ON public.items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = items.association_id
    )
  );

CREATE POLICY "Managers and admins can manage items"
  ON public.items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = items.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- Conventions policies
CREATE POLICY "Members can view conventions in their association"
  ON public.conventions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = conventions.association_id
    )
  );

CREATE POLICY "Managers and admins can manage conventions"
  ON public.conventions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() 
      AND am.association_id = conventions.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- User 2FA policies
CREATE POLICY "Users can view their own 2FA data"
  ON public.user_2fa
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA data"
  ON public.user_2fa
  FOR ALL
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (e.g., mark as read)"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "System & Super admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (is_system_or_super_admin());

CREATE POLICY "Admins can view audit logs for their association"
  ON public.audit_logs
  FOR SELECT
  USING (
    is_admin() AND
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN associations a ON am.association_id = a.id
      WHERE am.user_id = auth.uid() 
      AND (
        entity = 'associations' AND entity_id = a.id
        OR        entity = 'profiles' AND EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = entity_id AND p.association_id = a.id
        )
        OR
        entity IN ('items', 'categories', 'locations', 'conventions') 
        AND EXISTS (
          SELECT 1 FROM items i 
          WHERE i.id = entity_id AND i.association_id = a.id
        )
      )
    )
  );

CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure realtime updates work properly
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.associations REPLICA IDENTITY FULL;
ALTER TABLE public.association_members REPLICA IDENTITY FULL;
ALTER TABLE public.association_invitations REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.locations REPLICA IDENTITY FULL;
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.conventions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL; -- Add notifications to replica identity

-- Add tables to Realtime publication
BEGIN;
  DROP publication IF EXISTS supabase_realtime;
  CREATE publication supabase_realtime;
COMMIT;

BEGIN;
  ALTER publication supabase_realtime ADD TABLE public.profiles;
  ALTER publication supabase_realtime ADD TABLE public.associations;
  ALTER publication supabase_realtime ADD TABLE public.association_members;
  ALTER publication supabase_realtime ADD TABLE public.association_invitations;
  ALTER publication supabase_realtime ADD TABLE public.categories;
  ALTER publication supabase_realtime ADD TABLE public.locations;
  ALTER publication supabase_realtime ADD TABLE public.items;
  ALTER publication supabase_realtime ADD TABLE public.conventions;
  ALTER publication supabase_realtime ADD TABLE public.notifications; -- Add notifications to publication
COMMIT;

-- Appending migration: 20250421_equipment_sets_schema.sql
-- Add equipment_sets table for grouping inventory items
CREATE TABLE public.equipment_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_template BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store items in equipment sets
CREATE TABLE public.equipment_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_set_id UUID NOT NULL REFERENCES public.equipment_sets(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE, -- Corrected reference to items table
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for improved query performance
CREATE INDEX idx_equipment_set_items_set_id ON public.equipment_set_items(equipment_set_id);
CREATE INDEX idx_equipment_sets_association_id ON public.equipment_sets(association_id);

-- Row level security policies for equipment_sets
ALTER TABLE public.equipment_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their association's equipment sets"
  ON public.equipment_sets
  FOR SELECT
  USING (
    association_id IN (
      SELECT association_id FROM public.association_members WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

CREATE POLICY "Association admins and managers can create equipment sets"
  ON public.equipment_sets
  FOR INSERT
  WITH CHECK (
    association_id IN (
      SELECT am.association_id
      FROM public.association_members am
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND p.role IN ('admin', 'manager', 'system_admin', 'super_admin') -- Updated roles based on profiles table
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

CREATE POLICY "Association admins and managers can update equipment sets"
  ON public.equipment_sets
  FOR UPDATE
  USING (
    association_id IN (
      SELECT am.association_id
      FROM public.association_members am
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND p.role IN ('admin', 'manager', 'system_admin', 'super_admin') -- Updated roles based on profiles table
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

CREATE POLICY "Association admins and managers can delete equipment sets"
  ON public.equipment_sets
  FOR DELETE
  USING (
    association_id IN (
      SELECT am.association_id
      FROM public.association_members am
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND p.role IN ('admin', 'manager', 'system_admin', 'super_admin') -- Updated roles based on profiles table
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

-- Row level security policies for equipment_set_items
ALTER TABLE public.equipment_set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their association's equipment set items"
  ON public.equipment_set_items
  FOR SELECT
  USING (
    equipment_set_id IN (
      SELECT id FROM public.equipment_sets
      WHERE association_id IN (
        SELECT association_id FROM public.association_members WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

CREATE POLICY "Association admins and managers can manage equipment set items"
  ON public.equipment_set_items
  FOR ALL
  USING (
    equipment_set_id IN (
      SELECT es.id
      FROM public.equipment_sets es
      JOIN public.association_members am ON es.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND p.role IN ('admin', 'manager', 'system_admin', 'super_admin') -- Updated roles based on profiles table
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

-- Table for convention equipment set assignments (optional for future use)
-- Note: This references public.locations, ensure it exists or adjust as needed.
CREATE TABLE public.convention_equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  equipment_set_id UUID NOT NULL REFERENCES public.equipment_sets(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, equipment_set_id)
);

-- Add index for improved query performance
CREATE INDEX idx_convention_equipment_convention_id ON public.convention_equipment_assignments(convention_id);

-- Row level security for convention equipment assignments
ALTER TABLE public.convention_equipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their association's convention equipment assignments"
  ON public.convention_equipment_assignments
  FOR SELECT
  USING (
    convention_id IN (
      SELECT id FROM public.conventions
      WHERE association_id IN (
        SELECT association_id FROM public.association_members WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

CREATE POLICY "Association admins and managers can manage convention equipment assignments"
  ON public.convention_equipment_assignments
  FOR ALL
  USING (
    convention_id IN (
      SELECT c.id
      FROM public.conventions c
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND p.role IN ('admin', 'manager', 'system_admin', 'super_admin') -- Updated roles based on profiles table
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'system_admin')
    )
  );

-- Appending migration: 20250421_convention_features.sql
-- Convention Features Migration
-- This migration adds the necessary tables for full convention management functionality

-- Convention Locations table: Maps rooms and areas at conventions
CREATE TABLE IF NOT EXISTS public.convention_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'room', -- room, area, storage, etc.
  capacity INTEGER,
  floor TEXT,
  building TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, name)
);

-- Enable RLS on convention locations
ALTER TABLE public.convention_locations ENABLE ROW LEVEL SECURITY;

-- Convention Equipment table: Tracks equipment issued to conventions
CREATE TABLE IF NOT EXISTS public.convention_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  location_id UUID REFERENCES public.convention_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'allocated', -- allocated, issued, returned, damaged
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMP WITH TIME ZONE,
  returned_by UUID REFERENCES auth.users(id),
  returned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, item_id)
);

-- Enable RLS on convention equipment
ALTER TABLE public.convention_equipment ENABLE ROW LEVEL SECURITY;

-- Convention Consumables table: Tracks consumables used in conventions
CREATE TABLE IF NOT EXISTS public.convention_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  allocated_quantity INTEGER NOT NULL DEFAULT 0,
  used_quantity INTEGER NOT NULL DEFAULT 0,
  location_id UUID REFERENCES public.convention_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, item_id)
);

-- Enable RLS on convention consumables
ALTER TABLE public.convention_consumables ENABLE ROW LEVEL SECURITY;

-- Convention Requirements table: Tracks requirements for conventions
CREATE TABLE IF NOT EXISTS public.convention_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'requested', -- requested, approved, denied, fulfilled
  priority TEXT DEFAULT 'medium', -- high, medium, low
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on convention requirements
ALTER TABLE public.convention_requirements ENABLE ROW LEVEL SECURITY;

-- Convention Requirement Items: Links requirements to specific items
CREATE TABLE IF NOT EXISTS public.convention_requirement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES public.convention_requirements(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  equipment_set_id UUID REFERENCES public.equipment_sets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Either item_id or equipment_set_id must be set, but not both
  CONSTRAINT item_or_set_check CHECK (
    (item_id IS NOT NULL AND equipment_set_id IS NULL) OR
    (item_id IS NULL AND equipment_set_id IS NOT NULL)
  )
);

-- Enable RLS on convention requirement items
ALTER TABLE public.convention_requirement_items ENABLE ROW LEVEL SECURITY;

-- Convention Logs table: Tracks all actions during conventions
CREATE TABLE IF NOT EXISTS public.convention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- equipment, consumable, requirement, etc.
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on convention logs
ALTER TABLE public.convention_logs ENABLE ROW LEVEL SECURITY;

-- Convention Templates table: Stores reusable convention templates
CREATE TABLE IF NOT EXISTS public.convention_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on convention templates
ALTER TABLE public.convention_templates ENABLE ROW LEVEL SECURITY;

-- Function to archive conventions
CREATE OR REPLACE FUNCTION public.archive_convention(convention_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update convention status to archived
  UPDATE public.conventions
  SET status = 'archived'
  WHERE id = convention_id;

  -- Log the archiving action
  INSERT INTO public.convention_logs(
    convention_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES(
    convention_id,
    auth.uid(),
    'archive',
    'convention',
    convention_id,
    jsonb_build_object('timestamp', now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Convention Equipment
CREATE POLICY "Users can view convention equipment in their associations" ON public.convention_equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage convention equipment" ON public.convention_equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE c.id = convention_id AND am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Convention Consumables
CREATE POLICY "Users can view convention consumables in their associations" ON public.convention_consumables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage convention consumables" ON public.convention_consumables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE c.id = convention_id AND am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Convention Locations
CREATE POLICY "Users can view convention locations in their associations" ON public.convention_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage convention locations" ON public.convention_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE c.id = convention_id AND am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Convention Requirements
CREATE POLICY "Users can view convention requirements in their associations" ON public.convention_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create convention requirements" ON public.convention_requirements
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage convention requirements" ON public.convention_requirements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE c.id = convention_id AND am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Convention Requirement Items
CREATE POLICY "Users can view convention requirement items" ON public.convention_requirement_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.convention_requirements cr
      JOIN public.conventions c ON cr.convention_id = c.id
      WHERE cr.id = requirement_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage convention requirement items" ON public.convention_requirement_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.convention_requirements cr
      JOIN public.conventions c ON cr.convention_id = c.id
      JOIN public.association_members am ON c.association_id = am.association_id
      JOIN public.profiles p ON am.user_id = p.id
      WHERE cr.id = requirement_id AND am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Convention Logs
CREATE POLICY "Users can view convention logs in their associations" ON public.convention_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create convention logs" ON public.convention_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Convention Templates
CREATE POLICY "Users can view convention templates in their associations" ON public.convention_templates
  FOR SELECT USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage convention templates" ON public.convention_templates
  FOR ALL USING (
    association_id IN (
      SELECT am.association_id FROM public.association_members am
      JOIN public.profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid() AND p.role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

-- Create database trigger to automatically log convention equipment changes
CREATE OR REPLACE FUNCTION log_convention_equipment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.convention_logs(
      convention_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES(
      NEW.convention_id,
      auth.uid(),
      'create',
      'equipment',
      NEW.id,
      jsonb_build_object('item_id', NEW.item_id, 'quantity', NEW.quantity, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.convention_logs(
      convention_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES(
      NEW.convention_id,
      auth.uid(),
      'update',
      'equipment',
      NEW.id,
      jsonb_build_object(
        'changes', jsonb_build_object(
          'status', jsonb_build_object('old', OLD.status, 'new', NEW.status),
          'quantity', jsonb_build_object('old', OLD.quantity, 'new', NEW.quantity)
        )
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.convention_logs(
      convention_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES(
      OLD.convention_id,
      auth.uid(),
      'delete',
      'equipment',
      OLD.id,
      jsonb_build_object('item_id', OLD.item_id)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for convention equipment logging
DROP TRIGGER IF EXISTS log_convention_equipment_insert ON public.convention_equipment;
CREATE TRIGGER log_convention_equipment_insert
AFTER INSERT ON public.convention_equipment
FOR EACH ROW EXECUTE FUNCTION log_convention_equipment_changes();

DROP TRIGGER IF EXISTS log_convention_equipment_update ON public.convention_equipment;
CREATE TRIGGER log_convention_equipment_update
AFTER UPDATE ON public.convention_equipment
FOR EACH ROW EXECUTE FUNCTION log_convention_equipment_changes();

DROP TRIGGER IF EXISTS log_convention_equipment_delete ON public.convention_equipment;
CREATE TRIGGER log_convention_equipment_delete
AFTER DELETE ON public.convention_equipment
FOR EACH ROW EXECUTE FUNCTION log_convention_equipment_changes();


-- Appending migration: 20250421_unify_roles_migration.sql
-- MIGRATION: Unify role column to profiles table
-- This script removes the role column from association_members table
-- and updates all relevant functions and policies

-- 1. First, ensure all users have appropriate roles in their profile
-- Copy roles from association_members to profiles where the profile role is 'guest'
-- and association_members role is higher (prioritizing higher roles)
-- Note: We're not actually running this update since we need to decide the migration logic
-- based on business rules - this is just an example approach
/*
UPDATE public.profiles p
SET role = am.role
FROM public.association_members am
WHERE p.id = am.user_id AND p.role = 'guest' AND
      am.role::text IN ('member', 'manager', 'admin', 'system_admin', 'super_admin');
*/

-- 2. Modify the association_members table to remove the role column
-- Check if the column exists before dropping it
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'association_members' AND column_name = 'role') THEN
    ALTER TABLE public.association_members DROP COLUMN role;
  END IF;
END $$;


-- 3. Update the get_user_association_memberships function to not return role
-- Already updated in the base schema.sql, no change needed here.

-- 4. Update RLS policies that were referencing roles in association_members
-- These policies are already updated in the base schema.sql to use the profiles table.
-- The DROP/CREATE statements below are redundant if the base schema.sql is up-to-date.
-- However, running them again ensures the correct state.

-- For categories
DROP POLICY IF EXISTS "Managers and admins can manage categories" ON public.categories;
CREATE POLICY "Managers and admins can manage categories"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = categories.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- For locations
DROP POLICY IF EXISTS "Managers and admins can manage locations" ON public.locations;
CREATE POLICY "Managers and admins can manage locations"
  ON public.locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = locations.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- For items
DROP POLICY IF EXISTS "Managers and admins can manage items" ON public.items;
CREATE POLICY "Managers and admins can manage items"
  ON public.items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = items.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- For conventions
DROP POLICY IF EXISTS "Managers and admins can manage conventions" ON public.conventions;
CREATE POLICY "Managers and admins can manage conventions"
  ON public.conventions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = conventions.association_id
      AND p.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- For association members
DROP POLICY IF EXISTS "Admins can manage association members" ON public.association_members;
CREATE POLICY "Admins can manage association members"
  ON public.association_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = association_members.association_id
      AND p.role IN ('admin', 'system_admin', 'super_admin')
    )
  );

-- Update the association members invitation policy
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.association_invitations;
CREATE POLICY "Admins can manage invitations"
  ON public.association_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      JOIN profiles p ON am.user_id = p.id
      WHERE am.user_id = auth.uid()
      AND am.association_id = association_invitations.association_id
      AND p.role IN ('admin', 'system_admin', 'super_admin')
    )
  );

-- Note: The association_invitations table still has a role column which
-- should probably be kept to assign a default role to new members

-- Add new tables to Realtime publication
BEGIN;
  ALTER publication supabase_realtime ADD TABLE public.equipment_sets;
  ALTER publication supabase_realtime ADD TABLE public.equipment_set_items;
  ALTER publication supabase_realtime ADD TABLE public.convention_equipment;
  ALTER publication supabase_realtime ADD TABLE public.convention_consumables;
  ALTER publication supabase_realtime ADD TABLE public.convention_locations;
  ALTER publication supabase_realtime ADD TABLE public.convention_requirements;
  ALTER publication supabase_realtime ADD TABLE public.convention_requirement_items;
  ALTER publication supabase_realtime ADD TABLE public.convention_logs;
  ALTER publication supabase_realtime ADD TABLE public.convention_templates;
  ALTER publication supabase_realtime ADD TABLE public.convention_equipment_assignments;
COMMIT;

-- Add REPLICA IDENTITY FULL to new tables
ALTER TABLE public.equipment_sets REPLICA IDENTITY FULL;
ALTER TABLE public.equipment_set_items REPLICA IDENTITY FULL;
ALTER TABLE public.convention_equipment REPLICA IDENTITY FULL;
ALTER TABLE public.convention_consumables REPLICA IDENTITY FULL;
ALTER TABLE public.convention_locations REPLICA IDENTITY FULL;
ALTER TABLE public.convention_requirements REPLICA IDENTITY FULL;
ALTER TABLE public.convention_requirement_items REPLICA IDENTITY FULL;
ALTER TABLE public.convention_logs REPLICA IDENTITY FULL;
ALTER TABLE public.convention_templates REPLICA IDENTITY FULL;
ALTER TABLE public.convention_equipment_assignments REPLICA IDENTITY FULL;