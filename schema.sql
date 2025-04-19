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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key to profiles table after associations table is created
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_association
  FOREIGN KEY (association_id) REFERENCES public.associations(id) ON DELETE SET NULL;

-- Association members linking users to associations with roles
CREATE TABLE public.association_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'member',
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

-- Chat messages for association members
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  totp_secret TEXT NOT NULL,
  recovery_keys TEXT[] NOT NULL,
  used_recovery_keys TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Helper functions for RLS policies --

-- Create user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
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

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user();

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

-- Trigger to update profile when user changes
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

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

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can create associations"
  ON public.associations
  FOR INSERT
  WITH CHECK (true);

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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = association_members.association_id
      AND am.role IN ('admin', 'system_admin', 'super_admin')
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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = association_invitations.association_id
      AND am.role IN ('admin', 'system_admin', 'super_admin')
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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = categories.association_id
      AND am.role IN ('manager', 'admin', 'system_admin', 'super_admin')
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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = locations.association_id
      AND am.role IN ('manager', 'admin', 'system_admin', 'super_admin')
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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = items.association_id
      AND am.role IN ('manager', 'admin', 'system_admin', 'super_admin')
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
      WHERE am.user_id = auth.uid() 
      AND am.association_id = conventions.association_id
      AND am.role IN ('manager', 'admin', 'system_admin', 'super_admin')
    )
  );

-- Chat messages policies
CREATE POLICY "Members can view messages in their association"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = chat_messages.association_id
    )
  );

CREATE POLICY "Authenticated users can send messages to their association"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.user_id = auth.uid() 
      AND am.association_id = chat_messages.association_id
    ) AND auth.uid() = sender_id
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
        OR 
        entity = 'profiles' AND EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = entity_id AND p.association_id = a.id
        )
        OR
        entity IN ('items', 'categories', 'locations', 'conventions', 'chat_messages') 
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
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

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
  ALTER publication supabase_realtime ADD TABLE public.chat_messages;
COMMIT;

-- Insert some default data for testing
INSERT INTO public.associations (id, name, contact_email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Association', 'demo@example.com');

INSERT INTO public.categories (id, name, association_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Electronics', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'Furniture', '00000000-0000-0000-0000-000000000001');

INSERT INTO public.locations (id, name, association_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Main Storage', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'Office', '00000000-0000-0000-0000-000000000001');
-- This migration adds the missing tables that are defined in database.types.ts but don't exist in the database

-- Create convention_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.convention_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL, 
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uses_remaining INTEGER NOT NULL DEFAULT 1,
  UNIQUE(code)
);

-- Enable RLS on convention_invitations
ALTER TABLE public.convention_invitations ENABLE ROW LEVEL SECURITY;

-- Create convention_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.convention_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitation_code TEXT REFERENCES public.convention_invitations(code) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, user_id)
);

-- Enable RLS on convention_access
ALTER TABLE public.convention_access ENABLE ROW LEVEL SECURITY;

-- Create equipment_sets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.equipment_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on equipment_sets
ALTER TABLE public.equipment_sets ENABLE ROW LEVEL SECURITY;

-- Create equipment_set_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.equipment_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID REFERENCES public.equipment_sets(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(set_id, item_id)
);

-- Enable RLS on equipment_set_items
ALTER TABLE public.equipment_set_items ENABLE ROW LEVEL SECURITY;

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for each table
-- Convention Invitations
CREATE POLICY "Users can view convention invitations" ON public.convention_invitations
  FOR SELECT USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Admins can create convention invitations" ON public.convention_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

-- Convention Access
CREATE POLICY "Users can view their convention access" ON public.convention_access
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can create their convention access" ON public.convention_access
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Equipment Sets
CREATE POLICY "Users can view equipment sets in their associations" ON public.equipment_sets
  FOR SELECT USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create equipment sets" ON public.equipment_sets
  FOR INSERT WITH CHECK (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Admins can update equipment sets" ON public.equipment_sets
  FOR UPDATE USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete equipment sets" ON public.equipment_sets
  FOR DELETE USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
    )
  );

-- Equipment Set Items
CREATE POLICY "Users can view equipment set items" ON public.equipment_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can create equipment set items" ON public.equipment_set_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

CREATE POLICY "Admins can update equipment set items" ON public.equipment_set_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

CREATE POLICY "Admins can delete equipment set items" ON public.equipment_set_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

-- Documents
CREATE POLICY "Users can view documents in their associations" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can mark their notifications as read" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid() AND
    (read IS NOT NULL)
  );

CREATE POLICY "Administrators can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    TRUE
  );

-- Add ip_address column to audit_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD COLUMN ip_address TEXT;
    END IF;
END
$$;
-- Add missing columns to audit_logs table if ip_address doesn't exist
ALTER TABLE IF EXISTS public.audit_logs
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Update association_members table to make sure profile info is properly joined
-- First make sure we have proper foreign key relationship between user_id and profiles
ALTER TABLE IF EXISTS public.association_members
DROP CONSTRAINT IF EXISTS association_members_user_id_fkey,
ADD CONSTRAINT association_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Make sure the profiles table has proper index for faster joins
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Function to execute SQL (for admin use only during setup)
-- This function allows the setup wizard to execute the schema SQL
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
