-- Enable uuid-ossp extension if not already enabled (provides gen_random_uuid())
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- Trigger Function for Updated Timestamps
-- -----------------------------------------------------------------------------
-- Define the timestamp trigger function first so it can be referenced by triggers
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Enum Types
-- -----------------------------------------------------------------------------
-- Define user roles
CREATE TYPE public.user_role_type AS ENUM (
  'super_admin',
  'system_admin',
  'admin',
  'manager',
  'member',
  'guest'
);

-- Define convention-specific role types
CREATE TYPE public.convention_role_type AS ENUM (
  'organizer',
  'staff',
  'helper',
  'attendee'
);

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- Associations Table
CREATE TABLE public.associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  contact_email text NOT NULL CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  contact_phone text,
  website text CHECK (website IS NULL OR website ~* '^https?://.+'),
  address text,
  logo text, -- URL to logo in storage
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.associations IS 'Stores information about different associations or organizations using the platform.';
COMMENT ON COLUMN public.associations.logo IS 'URL pointing to the association logo stored in Supabase Storage.';

-- Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) > 0),
  email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role public.user_role_type NOT NULL DEFAULT 'guest',
  profile_image text, -- URL to profile image in storage
  two_factor_enabled boolean NOT NULL DEFAULT false,
  association_id uuid REFERENCES public.associations(id) ON DELETE SET NULL, -- User's primary association (can be null initially)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the built-in auth.users table.';
COMMENT ON COLUMN public.profiles.id IS 'Links directly to the auth.users table.';
COMMENT ON COLUMN public.profiles.association_id IS 'The primary association this user belongs to. Can be NULL if not associated or pending setup.';
COMMENT ON COLUMN public.profiles.profile_image IS 'URL pointing to the user profile image stored in Supabase Storage.';

-- Association Members Table (Junction table for many-to-many relationship)
CREATE TABLE public.association_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  role public.user_role_type NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, association_id) -- Ensure a user can only have one role per association
);
COMMENT ON TABLE public.association_members IS 'Maps users to associations and defines their role within that association.';

-- Association Invitations Table
CREATE TABLE public.association_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK (char_length(code) > 5), -- Ensure code is reasonably long
  email text CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Optional: restrict invitation to specific email
  role public.user_role_type NOT NULL DEFAULT 'member',
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  used boolean DEFAULT false,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at timestamp with time zone
);
COMMENT ON TABLE public.association_invitations IS 'Stores invitation codes for users to join an association.';

-- Locations Table (Hierarchical)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  parent_id uuid REFERENCES public.locations(id) ON DELETE SET NULL, -- Allow parent deletion without deleting children
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  is_room boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.locations IS 'Stores hierarchical locations within an association (e.g., Building > Floor > Room > Shelf).';

-- Categories Table (Hierarchical)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL, -- Allow parent deletion without deleting children
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.categories IS 'Stores hierarchical categories for inventory items.';

-- Items Table
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  serial_number text,
  barcode text,
  condition text NOT NULL DEFAULT 'Unknown',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  is_consumable boolean NOT NULL DEFAULT false,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  minimum_quantity integer CHECK (minimum_quantity IS NULL OR minimum_quantity >= 0),
  purchase_price numeric(10, 2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
  purchase_date date,
  warranty_expiration date,
  image text, -- URL to item image in storage
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.items IS 'Stores details about individual inventory items.';
COMMENT ON COLUMN public.items.image IS 'URL pointing to the item image stored in Supabase Storage.';

-- Create partial unique indexes for items table
CREATE UNIQUE INDEX idx_items_unique_barcode_per_association ON public.items (association_id, barcode) WHERE (barcode IS NOT NULL);
CREATE UNIQUE INDEX idx_items_unique_serial_number_per_association ON public.items (association_id, serial_number) WHERE (serial_number IS NOT NULL);

-- Equipment Sets Table
CREATE TABLE public.equipment_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.equipment_sets IS 'Defines reusable sets or kits of equipment.';

-- Equipment Set Items Table (Junction table)
CREATE TABLE public.equipment_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.equipment_sets(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (set_id, item_id) -- Ensure an item appears only once per set
);
COMMENT ON TABLE public.equipment_set_items IS 'Links items to equipment sets, specifying quantity.';

-- Documents Table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  file_url text NOT NULL, -- URL to document in storage
  file_type text NOT NULL, -- e.g., 'application/pdf', 'image/jpeg'
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE, -- Link document to an item
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- Set null if user deleted
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.documents IS 'Stores metadata about uploaded documents related to items.';
COMMENT ON COLUMN public.documents.file_url IS 'URL pointing to the document file stored in Supabase Storage.';

-- Conventions Table
CREATE TABLE public.conventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text, -- Physical location address or description
  status text NOT NULL DEFAULT 'Planning', -- e.g., Planning, Active, Archived
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CHECK (end_date >= start_date)
);
COMMENT ON TABLE public.conventions IS 'Stores information about specific conventions or events.';

-- Convention Locations Table (Specific locations used within a convention)
CREATE TABLE public.convention_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) > 0),
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (convention_id, name) -- Location names unique within a convention
);
COMMENT ON TABLE public.convention_locations IS 'Defines specific locations relevant to a particular convention (e.g., "Main Hall", "Panel Room 1").';

-- Convention Equipment Table (Tracks equipment assigned to a convention)
CREATE TABLE public.convention_equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT, -- Prevent item deletion if assigned
    convention_location_id uuid REFERENCES public.convention_locations(id) ON DELETE SET NULL, -- Where the equipment is needed
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status text NOT NULL DEFAULT 'Requested', -- e.g., Requested, Assigned, Deployed, Returned
    notes text,
    assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.convention_equipment IS 'Tracks non-consumable equipment allocated to a convention.';

-- Convention Consumables Table (Tracks consumables used/needed for a convention)
CREATE TABLE public.convention_consumables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT, -- Prevent item deletion if assigned, ensure is_consumable=true via RLS/trigger later
    convention_location_id uuid REFERENCES public.convention_locations(id) ON DELETE SET NULL, -- Where the consumable is needed
    quantity_requested integer NOT NULL CHECK (quantity_requested > 0),
    quantity_used integer DEFAULT 0 CHECK (quantity_used >= 0),
    notes text,
    requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (quantity_used <= quantity_requested) -- Cannot use more than requested (adjust if needed)
);
COMMENT ON TABLE public.convention_consumables IS 'Tracks consumable items requested and used for a convention.';

-- Convention Requirements Table (General requirements for a convention)
CREATE TABLE public.convention_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    description text NOT NULL CHECK (char_length(description) > 0),
    status text NOT NULL DEFAULT 'Pending', -- e.g., Pending, In Progress, Completed, Cancelled
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date date,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.convention_requirements IS 'Tracks general tasks or requirements for a convention.';

-- Convention Templates Table (Templates for setting up conventions)
CREATE TABLE public.convention_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(name) > 0),
    description text,
    association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    template_data jsonb NOT NULL, -- Stores the structure (locations, equipment, consumables, requirements)
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (association_id, name) -- Template names unique within an association
);
COMMENT ON TABLE public.convention_templates IS 'Stores predefined templates for quickly setting up new conventions.';
COMMENT ON COLUMN public.convention_templates.template_data IS 'JSONB field containing the template structure (e.g., required locations, equipment lists, consumable needs, standard requirements).';

-- Convention Logs Table (Activity log specific to a convention)
CREATE TABLE public.convention_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- User performing the action
    action text NOT NULL, -- Description of the action (e.g., "Added Equipment", "Updated Status")
    details jsonb, -- Optional details about the action
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.convention_logs IS 'Logs significant actions performed within the context of a specific convention.';

-- Convention Access Table (Grants specific users access to a convention, e.g., helpers)
CREATE TABLE public.convention_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.convention_role_type NOT NULL DEFAULT 'attendee',
  invitation_code text, -- Optional: track which invitation was used
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (convention_id, user_id) -- User can only have access once per convention
);
COMMENT ON TABLE public.convention_access IS 'Grants explicit access to a convention for users and defines their role within that convention.';

-- Convention Invitations Table (Invite external helpers)
CREATE TABLE public.convention_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (char_length(code) > 5),
  convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.convention_role_type NOT NULL DEFAULT 'attendee',
  expires_at timestamp with time zone NOT NULL,
  uses_remaining integer NOT NULL DEFAULT 1 CHECK (uses_remaining >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.convention_invitations IS 'Stores invitation codes for external users (helpers) to join/access a specific convention.';

-- Audit Logs Table
CREATE TABLE public.audit_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  entity text NOT NULL, -- e.g., 'profiles', 'items', 'conventions'
  action text NOT NULL, -- e.g., 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'ROLE_CHANGE'
  entity_id text, -- Can be uuid or other identifier, so text is safer
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- User performing the action
  changes jsonb, -- Stores old and new values for UPDATE actions
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address inet -- Store the IP address of the user performing the action
);
COMMENT ON TABLE public.audit_logs IS 'Tracks significant changes and actions across the system for auditing purposes.';

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.notifications IS 'Stores notifications for users.';

-- User 2FA Table
CREATE TABLE public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  totp_secret text NOT NULL,
  recovery_keys text[] NOT NULL, -- Array of hashed recovery keys
  used_recovery_keys text[] DEFAULT '{}', -- Array of used hashed recovery keys
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_used_at timestamp with time zone
);
COMMENT ON TABLE public.user_2fa IS 'Stores Two-Factor Authentication secrets and recovery keys for users.';

-- Chat Messages Table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) > 0),
  sender_name text NOT NULL, -- Denormalized for easier display
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.chat_messages IS 'Stores chat messages within an association.';

-- Module Manifests Table
CREATE TABLE public.module_manifests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id text NOT NULL UNIQUE, -- e.g., "inventory", "conventions"
    version text NOT NULL,
    name text NOT NULL,
    description text,
    installed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.module_manifests IS 'Tracks installed modules and their versions.';

-- Module Migrations Table
CREATE TABLE public.module_migrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id text NOT NULL REFERENCES public.module_manifests(module_id) ON DELETE CASCADE,
    version text NOT NULL, -- The version this migration belongs to
    migration_name text NOT NULL, -- Identifier for the migration script/step
    executed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (module_id, version, migration_name)
);
COMMENT ON TABLE public.module_migrations IS 'Tracks executed database migrations for each module.';

-- Module Configurations Table
CREATE TABLE public.module_configurations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id text NOT NULL REFERENCES public.module_manifests(module_id) ON DELETE CASCADE,
    association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE, -- NULL for global settings
    key text NOT NULL,
    value jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (module_id, association_id, key) -- Configuration key unique per module/association scope
);
COMMENT ON TABLE public.module_configurations IS 'Stores configuration settings for modules, potentially scoped per association.';

-- -----------------------------------------------------------------------------
-- Helper Functions for RLS
-- -----------------------------------------------------------------------------

-- Function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Function to get the current user's role in their primary association
CREATE OR REPLACE FUNCTION public.get_my_association_role()
RETURNS public.user_role_type
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Function to check if the current user is a member of a specific association
CREATE OR REPLACE FUNCTION public.is_member_of_association(p_association_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.association_members
    WHERE user_id = auth.uid() AND association_id = p_association_id
  );
$$;

-- Function to get the current user's role in a specific association
CREATE OR REPLACE FUNCTION public.get_user_role_in_association(p_user_id uuid, p_association_id uuid)
RETURNS public.user_role_type
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.association_members
  WHERE user_id = p_user_id AND association_id = p_association_id
  LIMIT 1;
$$;

-- Function to get the current user's primary association ID from their profile
CREATE OR REPLACE FUNCTION public.get_my_association_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT association_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Function to check if the user has a specific role or higher in their association
CREATE OR REPLACE FUNCTION public.has_role_or_higher(required_role public.user_role_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.user_role_type;
  role_hierarchy public.user_role_type[] := ARRAY['guest', 'member', 'manager', 'admin', 'system_admin', 'super_admin'];
  user_level int;
  required_level int;
BEGIN
  user_role := public.get_my_association_role();

  IF user_role IS NULL THEN
    RETURN FALSE; -- User not found or has no role
  END IF;

  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  IF user_level IS NULL OR required_level IS NULL THEN
    RETURN FALSE; -- Should not happen if enums are correct
  END IF;

  RETURN user_level >= required_level;
END;
$$;

-- Function to check if a user can access a specific convention (member or invited)
CREATE OR REPLACE FUNCTION public.can_access_convention(p_convention_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_association_id uuid;
BEGIN
    -- Get the association ID for the convention
    SELECT association_id INTO v_association_id
    FROM public.conventions
    WHERE id = p_convention_id;

    IF v_association_id IS NULL THEN
        RETURN FALSE; -- Convention not found
    END IF;

    -- Check if the user is a member of the association OR has specific access granted
    RETURN EXISTS (
        SELECT 1
        FROM public.association_members
        WHERE user_id = auth.uid() AND association_id = v_association_id
    ) OR EXISTS (
        SELECT 1
        FROM public.convention_access
        WHERE user_id = auth.uid() AND convention_id = p_convention_id
    );
END;
$$;

-- Function to check if user has role or higher in a SPECIFIC association
CREATE OR REPLACE FUNCTION public.has_role_or_higher_in_association(p_association_id uuid, required_role public.user_role_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.user_role_type;
  role_hierarchy public.user_role_type[] := ARRAY['guest', 'member', 'manager', 'admin', 'system_admin', 'super_admin'];
  user_level int;
  required_level int;
BEGIN
  -- Get role from association_members table for the specific association
  SELECT role INTO user_role
  FROM public.association_members
  WHERE user_id = auth.uid() AND association_id = p_association_id
  LIMIT 1;

  IF user_role IS NULL THEN
    RETURN FALSE; -- User not a member or has no role in this specific association
  END IF;

  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  IF user_level IS NULL OR required_level IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN user_level >= required_level;
END;
$$;

-- Function to check if user can manage a convention (either through association or direct convention role)
CREATE OR REPLACE FUNCTION public.can_manage_convention(p_convention_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_association_id uuid;
    v_convention_role public.convention_role_type;
BEGIN
    -- Check if user is super admin first (always can manage)
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Get the association ID for the convention
    SELECT association_id INTO v_association_id
    FROM public.conventions
    WHERE id = p_convention_id;

    IF v_association_id IS NULL THEN
        RETURN FALSE; -- Convention not found
    END IF;

    -- Check if user has manager role or higher in the association
    IF public.has_role_or_higher_in_association(v_association_id, 'manager') THEN
        RETURN TRUE;
    END IF;

    -- Check if user has organizer role in this specific convention
    SELECT role INTO v_convention_role
    FROM public.convention_access
    WHERE user_id = auth.uid() AND convention_id = p_convention_id;

    RETURN v_convention_role = 'organizer';
END;
$$;

-- Function to get a user's role within a specific convention
CREATE OR REPLACE FUNCTION public.get_convention_role(p_convention_id uuid)
RETURNS public.convention_role_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_association_id uuid;
    v_association_role public.user_role_type;
    v_convention_role public.convention_role_type;
BEGIN
    -- Check if the user has a specific role in the convention
    SELECT role INTO v_convention_role
    FROM public.convention_access
    WHERE user_id = auth.uid() AND convention_id = p_convention_id;
    
    IF v_convention_role IS NOT NULL THEN
        RETURN v_convention_role;
    END IF;
    
    -- If no specific convention role, check association role
    SELECT association_id INTO v_association_id
    FROM public.conventions
    WHERE id = p_convention_id;
    
    IF v_association_id IS NULL THEN
        RETURN NULL; -- Convention not found
    END IF;
    
    SELECT role INTO v_association_role
    FROM public.association_members
    WHERE user_id = auth.uid() AND association_id = v_association_id;
    
    -- Map association roles to convention roles
    IF v_association_role IN ('admin', 'system_admin', 'super_admin') THEN
        RETURN 'organizer'::public.convention_role_type;
    ELSIF v_association_role = 'manager' THEN
        RETURN 'staff'::public.convention_role_type;
    ELSIF v_association_role = 'member' THEN
        RETURN 'helper'::public.convention_role_type;
    ELSE
        RETURN NULL; -- No access
    END IF;
END;
$$;

-- Create a trigger to update convention_access.updated_at column
CREATE TRIGGER set_convention_access_timestamp
BEFORE UPDATE ON public.convention_access
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS Policies: convention_access & convention_invitations
-- Members can view convention access records within their association
CREATE POLICY "Members can view convention access" ON public.convention_access
FOR SELECT
USING (
  can_access_convention(convention_id)
);

-- Members can view their own access record
CREATE POLICY "Members can view own access record" ON public.convention_access
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Managers/Organizers can manage convention access
CREATE POLICY "Managers can manage convention access" ON public.convention_access
FOR ALL
USING (
  can_manage_convention(convention_id)
)
WITH CHECK (
  can_manage_convention(convention_id)
);

-- Managers/Organizers can create invitations for conventions they manage
CREATE POLICY "Managers can create convention invitations" ON public.convention_invitations
FOR INSERT
WITH CHECK (
  can_manage_convention(convention_id) AND created_by = auth.uid()
);

-- Managers/Organizers can view invitations for conventions they manage
CREATE POLICY "Managers can view convention invitations" ON public.convention_invitations
FOR SELECT
USING (
  can_manage_convention(convention_id)
);

-- Super admins can manage all convention access and invitations
CREATE POLICY "Super admins can manage all convention access" ON public.convention_access
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage all convention invitations" ON public.convention_invitations
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- -----------------------------------------------------------------------------
-- Triggers for `updated_at` columns
-- -----------------------------------------------------------------------------

-- Apply the trigger to tables with `updated_at`
CREATE TRIGGER set_associations_timestamp
BEFORE UPDATE ON public.associations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_locations_timestamp
BEFORE UPDATE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_categories_timestamp
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_items_timestamp
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_equipment_sets_timestamp
BEFORE UPDATE ON public.equipment_sets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_documents_timestamp
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_conventions_timestamp
BEFORE UPDATE ON public.conventions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_convention_locations_timestamp
BEFORE UPDATE ON public.convention_locations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_convention_equipment_timestamp
BEFORE UPDATE ON public.convention_equipment
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_convention_consumables_timestamp
BEFORE UPDATE ON public.convention_consumables
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_convention_requirements_timestamp
BEFORE UPDATE ON public.convention_requirements
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_convention_templates_timestamp
BEFORE UPDATE ON public.convention_templates
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_user_2fa_timestamp
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_module_manifests_timestamp
BEFORE UPDATE ON public.module_manifests
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_module_configurations_timestamp
BEFORE UPDATE ON public.module_configurations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- -----------------------------------------------------------------------------
-- Trigger to create profile on new user signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), -- Use name from metadata or fallback to email
    NEW.email,
    'guest' -- Default role for new signups
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger to ensure item is consumable for convention_consumables
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_item_is_consumable()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = NEW.item_id AND is_consumable = true) THEN
        RAISE EXCEPTION 'Item ID % is not marked as consumable.', NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_consumable_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.convention_consumables
FOR EACH ROW EXECUTE FUNCTION public.check_item_is_consumable();

-- -----------------------------------------------------------------------------
-- SQL Execution Function for RPC Calls
-- -----------------------------------------------------------------------------
-- Create the execute_sql function that can be called via RPC
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION execute_sql(text) IS 'Executes arbitrary SQL commands with SECURITY DEFINER privileges';

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_configurations ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (recommended by Supabase)
ALTER TABLE public.associations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.association_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.association_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.locations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_sets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_set_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conventions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_locations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_equipment FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_consumables FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_requirements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_access FORCE ROW LEVEL SECURITY;
ALTER TABLE public.convention_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.module_manifests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.module_migrations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.module_configurations FORCE ROW LEVEL SECURITY;

-- RLS Policies: profiles
-- Users can view their own profile.
CREATE POLICY "Allow user to view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
-- Users can update their own profile (except role and association_id).
CREATE POLICY "Allow user to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND association_id = (SELECT association_id FROM public.profiles WHERE id = auth.uid())); -- Prevent changing role/assoc directly
-- Super admins can view all profiles.
CREATE POLICY "Allow super admins to view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());
-- Super admins can update any profile (including role/association).
CREATE POLICY "Allow super admins to update any profile" ON public.profiles
  FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
-- Allow association admins/system_admins to view profiles within their association.
CREATE POLICY "Allow association admins to view member profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role_or_higher('admin') AND
    EXISTS (
      SELECT 1 FROM public.association_members am
      WHERE am.user_id = public.profiles.id
      AND am.association_id = public.get_my_association_id()
    )
  );
-- Allow association admins/system_admins to update profiles within their association (except super_admins).
CREATE POLICY "Allow association admins to update member profiles" ON public.profiles
  FOR UPDATE USING (
    public.has_role_or_higher('admin') AND
    EXISTS (
      SELECT 1 FROM public.association_members am
      WHERE am.user_id = public.profiles.id
      AND am.association_id = public.get_my_association_id()
    ) AND
    public.profiles.role <> 'super_admin' -- Cannot modify super admins
  ) WITH CHECK (
    public.has_role_or_higher('admin') AND
    EXISTS (
      SELECT 1 FROM public.association_members am
      WHERE am.user_id = public.profiles.id
      AND am.association_id = public.get_my_association_id()
    ) AND
    public.profiles.role <> 'super_admin'
  );

-- RLS Policies: associations
-- Authenticated users can view associations they are members of.
CREATE POLICY "Allow members to view their associations" ON public.associations
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.association_members am
      WHERE am.association_id = public.associations.id
      AND am.user_id = auth.uid()
    )
  );
-- Super admins can view all associations.
CREATE POLICY "Allow super admins to view all associations" ON public.associations
  FOR SELECT USING (public.is_super_admin());
-- Super admins can create associations.
CREATE POLICY "Allow super admins to create associations" ON public.associations
  FOR INSERT WITH CHECK (public.is_super_admin());
-- Association admins/system_admins can update their own association.
CREATE POLICY "Allow association admins to update their association" ON public.associations
  FOR UPDATE USING (
    public.has_role_or_higher('admin') AND
    public.associations.id = public.get_my_association_id()
  ) WITH CHECK (
    public.has_role_or_higher('admin') AND
    public.associations.id = public.get_my_association_id()
  );
-- Super admins can update any association.
CREATE POLICY "Allow super admins to update any association" ON public.associations
  FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
-- Super admins can delete associations (use with caution!).
CREATE POLICY "Allow super admins to delete associations" ON public.associations
  FOR DELETE USING (public.is_super_admin());

-- RLS Policies: association_members
-- Users can view their own membership.
CREATE POLICY "Allow user to view own membership" ON public.association_members
  FOR SELECT USING (auth.uid() = user_id);
-- Members can view other members of the same association.
CREATE POLICY "Allow members to view other members in same association" ON public.association_members
  FOR SELECT USING (
    -- Check if the row's association_id matches the user's primary association_id
    public.association_members.association_id = public.get_my_association_id()
  );
-- Association admins/system_admins can add members to their association.
CREATE POLICY "Allow association admins to add members" ON public.association_members
  FOR INSERT WITH CHECK (
    public.has_role_or_higher('admin') AND
    public.association_members.association_id = public.get_my_association_id() AND
    public.association_members.role <> 'super_admin' -- Cannot assign super_admin role
  );
-- Association admins/system_admins can update member roles (not to super_admin, not self if only admin).
CREATE POLICY "Allow association admins to update member roles" ON public.association_members
  FOR UPDATE USING (
    public.has_role_or_higher('admin') AND
    public.association_members.association_id = public.get_my_association_id() AND
    public.association_members.user_id <> auth.uid() -- Cannot change own role directly here (use profile update)
  ) WITH CHECK (
    public.has_role_or_higher('admin') AND
    public.association_members.association_id = public.get_my_association_id() AND
    public.association_members.role <> 'super_admin' AND -- Cannot promote to super_admin
    (SELECT role FROM public.profiles WHERE id = public.association_members.user_id) <> 'super_admin' -- Cannot demote existing super_admin
  );
-- Association admins/system_admins can remove members (not super_admins, not self if only admin).
CREATE POLICY "Allow association admins to remove members" ON public.association_members
  FOR DELETE USING (
    public.has_role_or_higher('admin') AND
    public.association_members.association_id = public.get_my_association_id() AND
    public.association_members.user_id <> auth.uid() AND -- Cannot remove self
    (SELECT role FROM public.profiles WHERE id = public.association_members.user_id) <> 'super_admin' -- Cannot remove super_admin
  );
-- Super admins can manage all memberships.
CREATE POLICY "Allow super admins to manage all memberships" ON public.association_members
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: association_invitations
-- Association admins/system_admins can manage invitations for their association.
CREATE POLICY "Allow association admins to manage invitations" ON public.association_invitations
  FOR ALL USING (
    public.has_role_or_higher('admin') AND
    public.association_invitations.association_id = public.get_my_association_id()
  ) WITH CHECK (
    public.has_role_or_higher('admin') AND
    public.association_invitations.association_id = public.get_my_association_id() AND
    public.association_invitations.role <> 'super_admin' -- Cannot invite as super_admin
  );
-- Authenticated users can view invitations matching their email (if specified).
CREATE POLICY "Allow users to view invitations for their email" ON public.association_invitations
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (public.association_invitations.email IS NULL OR public.association_invitations.email = (SELECT email FROM public.profiles WHERE id = auth.uid())) AND
    (public.association_invitations.expires_at IS NULL OR public.association_invitations.expires_at > now())
  );
-- Allow authenticated users to view invitations by code (for joining)
CREATE POLICY "Allow users to view invitations by code" ON public.association_invitations
  FOR SELECT USING (auth.role() = 'authenticated');
-- Super admins can manage all invitations.
CREATE POLICY "Allow super admins to manage all invitations" ON public.association_invitations
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: locations, categories, items, equipment_sets, equipment_set_items
-- Members can view resources within their association.
CREATE POLICY "Allow members to view association resources" ON public.locations
  FOR SELECT USING (public.is_member_of_association(association_id));
CREATE POLICY "Allow members to view association resources" ON public.categories
  FOR SELECT USING (public.is_member_of_association(association_id));
CREATE POLICY "Allow members to view association resources" ON public.items
  FOR SELECT USING (public.is_member_of_association(association_id));
CREATE POLICY "Allow members to view association resources" ON public.equipment_sets
  FOR SELECT USING (public.is_member_of_association(association_id));
CREATE POLICY "Allow members to view association resources" ON public.equipment_set_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.equipment_sets es
    WHERE es.id = public.equipment_set_items.set_id AND public.is_member_of_association(es.association_id)
  ));

-- Managers+ can manage resources within their association.
CREATE POLICY "Allow managers+ to manage association resources" ON public.locations
  FOR ALL USING (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id())
  WITH CHECK (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id());
CREATE POLICY "Allow managers+ to manage association resources" ON public.categories
  FOR ALL USING (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id())
  WITH CHECK (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id());
CREATE POLICY "Allow managers+ to manage association resources" ON public.items
  FOR ALL USING (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id())
  WITH CHECK (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id());
CREATE POLICY "Allow managers+ to manage association resources" ON public.equipment_sets
  FOR ALL USING (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id())
  WITH CHECK (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id());
CREATE POLICY "Allow managers+ to manage association resources" ON public.equipment_set_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.equipment_sets es
    WHERE es.id = public.equipment_set_items.set_id AND public.has_role_or_higher('manager') AND es.association_id = public.get_my_association_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.equipment_sets es
    WHERE es.id = public.equipment_set_items.set_id AND public.has_role_or_higher('manager') AND es.association_id = public.get_my_association_id()
  ));

-- Super admins can manage all resources.
CREATE POLICY "Allow super admins to manage all resources" ON public.locations FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage all resources" ON public.categories FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage all resources" ON public.items FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage all resources" ON public.equipment_sets FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage all resources" ON public.equipment_set_items FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: documents
-- Users can view documents linked to items they can view.
CREATE POLICY "Allow users to view documents for accessible items" ON public.documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.id = public.documents.item_id AND public.is_member_of_association(i.association_id)
  ));
-- Users can upload documents for items they can manage.
CREATE POLICY "Allow managers+ to upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = public.documents.item_id AND public.has_role_or_higher('manager') AND i.association_id = public.get_my_association_id()
    )
  );
-- Users can update documents they uploaded.
CREATE POLICY "Allow uploader to update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);
-- Users can delete documents they uploaded.
CREATE POLICY "Allow uploader to delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = uploaded_by);
-- Association admins can manage all documents within their association.
CREATE POLICY "Allow association admins to manage documents" ON public.documents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.id = public.documents.item_id AND public.has_role_or_higher('admin') AND i.association_id = public.get_my_association_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.id = public.documents.item_id AND public.has_role_or_higher('admin') AND i.association_id = public.get_my_association_id()
  ));
-- Super admins can manage all documents.
CREATE POLICY "Allow super admins to manage all documents" ON public.documents
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: conventions and related tables
-- Members/Helpers can view conventions they have access to.
CREATE POLICY "Allow access for members/helpers" ON public.conventions FOR SELECT USING (public.can_access_convention(id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_locations FOR SELECT USING (public.can_access_convention(convention_id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_equipment FOR SELECT USING (public.can_access_convention(convention_id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_consumables FOR SELECT USING (public.can_access_convention(convention_id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_requirements FOR SELECT USING (public.can_access_convention(convention_id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_logs FOR SELECT USING (public.can_access_convention(convention_id));
CREATE POLICY "Allow access for members/helpers" ON public.convention_access FOR SELECT USING (public.can_access_convention(convention_id) OR user_id = auth.uid()); -- Can see own access record

-- Managers+ can manage conventions within their association.
CREATE POLICY "Allow managers+ to manage conventions" ON public.conventions
    FOR ALL USING (public.can_manage_convention(id))
    WITH CHECK (public.can_manage_convention(id) AND association_id = public.get_my_association_id());
CREATE POLICY "Allow managers+ to manage convention locations" ON public.convention_locations
    FOR ALL USING (public.can_manage_convention(convention_id))
    WITH CHECK (public.can_manage_convention(convention_id));
CREATE POLICY "Allow managers+ to manage convention equipment" ON public.convention_equipment
    FOR ALL USING (public.can_manage_convention(convention_id))
    WITH CHECK (public.can_manage_convention(convention_id));
CREATE POLICY "Allow managers+ to manage convention consumables" ON public.convention_consumables
    FOR ALL USING (public.can_manage_convention(convention_id))
    WITH CHECK (public.can_manage_convention(convention_id));
CREATE POLICY "Allow managers+ to manage convention requirements" ON public.convention_requirements
    FOR ALL USING (public.can_manage_convention(convention_id))
    WITH CHECK (public.can_manage_convention(convention_id));
CREATE POLICY "Allow managers+ to manage convention logs" ON public.convention_logs
    FOR INSERT WITH CHECK (public.can_manage_convention(convention_id) AND user_id = auth.uid()); -- Can only insert logs as self
-- Note: Convention logs are generally append-only, updates/deletes might be restricted further or handled by super admins.

-- Managers+ can manage convention access records (except self).
CREATE POLICY "Allow managers+ to manage convention access" ON public.convention_access
    FOR ALL USING (public.can_manage_convention(convention_id) AND user_id <> auth.uid())
    WITH CHECK (public.can_manage_convention(convention_id) AND user_id <> auth.uid());

-- Managers+ can manage convention templates for their association.
CREATE POLICY "Allow managers+ to manage convention templates" ON public.convention_templates
    FOR ALL USING (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id())
    WITH CHECK (public.has_role_or_higher('manager') AND association_id = public.get_my_association_id());

-- Managers+ can manage convention invitations.
CREATE POLICY "Allow managers+ to manage convention invitations" ON public.convention_invitations
    FOR ALL USING (public.can_manage_convention(convention_id))
    WITH CHECK (public.can_manage_convention(convention_id) AND created_by = auth.uid()); -- Check creator on insert/update

-- Authenticated users can view/use valid convention invitations.
CREATE POLICY "Allow users to view/use convention invitations" ON public.convention_invitations
    FOR SELECT USING (auth.role() = 'authenticated' AND expires_at > now() AND uses_remaining > 0);

-- Super admins can manage all convention-related data.
CREATE POLICY "Super admin full access" ON public.conventions FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_locations FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_equipment FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_consumables FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_requirements FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_logs FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_access FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_invitations FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access" ON public.convention_templates FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: audit_logs
-- Super admins can view all audit logs.
CREATE POLICY "Allow super admins to view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_super_admin());
-- Allow system inserts (e.g., from triggers or backend functions). This requires careful setup.
-- For simplicity, we'll rely on super admin access for viewing. Inserting is often done via SECURITY DEFINER functions or backend roles.
-- A policy allowing users to see their *own* actions might be added if needed:
-- CREATE POLICY "Allow users to view their own audit logs" ON public.audit_logs
--   FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies: notifications
-- Users can view their own notifications.
CREATE POLICY "Allow user to view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
-- Users can mark their own notifications as read/unread.
CREATE POLICY "Allow user to update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Users can delete their own notifications.
CREATE POLICY "Allow user to delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
-- Allow system inserts (e.g., from backend functions).
-- For simplicity, inserts might be handled by SECURITY DEFINER functions or backend roles.
-- Super admins can manage all notifications (for debugging/admin purposes).
CREATE POLICY "Allow super admins to manage all notifications" ON public.notifications
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: user_2fa
-- Users can manage their own 2FA settings.
CREATE POLICY "Allow user to manage own 2FA" ON public.user_2fa
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Super admins can view 2FA status (but not secrets/keys) for recovery purposes.
CREATE POLICY "Allow super admins to view 2FA status" ON public.user_2fa
  FOR SELECT USING (public.is_super_admin());
-- Potentially allow super admins to delete 2FA setup for account recovery (use with extreme caution).
-- CREATE POLICY "Allow super admins to delete 2FA setup" ON public.user_2fa
--   FOR DELETE USING (public.is_super_admin());

-- RLS Policies: chat_messages
-- Members can view chat messages within their association.
CREATE POLICY "Allow members to view association chat" ON public.chat_messages
  FOR SELECT USING (public.is_member_of_association(association_id));
-- Members can insert chat messages into their association chat.
CREATE POLICY "Allow members to insert association chat" ON public.chat_messages
  FOR INSERT WITH CHECK (
    public.is_member_of_association(association_id) AND
    sender_id = auth.uid() AND
    sender_name = (SELECT name FROM public.profiles WHERE id = auth.uid()) -- Ensure sender name matches profile
  );
-- Allow message authors or association admins to delete messages (optional).
CREATE POLICY "Allow author or admin to delete chat messages" ON public.chat_messages
  FOR DELETE USING (
    sender_id = auth.uid() OR
    (public.has_role_or_higher('admin') AND association_id = public.get_my_association_id())
  );
-- Super admins can manage all chat messages.
CREATE POLICY "Allow super admins to manage all chat messages" ON public.chat_messages
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- RLS Policies: Modules (Manifests, Migrations, Configurations)
-- Generally, these should only be managed by super admins or specific backend processes.
CREATE POLICY "Allow super admins to manage modules" ON public.module_manifests
    FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage module migrations" ON public.module_migrations
    FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow super admins to manage global module configurations" ON public.module_configurations
    FOR ALL USING (public.is_super_admin() AND association_id IS NULL)
    WITH CHECK (public.is_super_admin() AND association_id IS NULL);
-- Allow association admins to manage association-specific configurations.
CREATE POLICY "Allow association admins to manage association module configurations" ON public.module_configurations
    FOR ALL USING (public.has_role_or_higher('admin') AND association_id = public.get_my_association_id())
    WITH CHECK (public.has_role_or_higher('admin') AND association_id = public.get_my_association_id());
-- Allow members to read association-specific configurations.
CREATE POLICY "Allow members to read association module configurations" ON public.module_configurations
    FOR SELECT USING (public.is_member_of_association(association_id));

-- -----------------------------------------------------------------------------
-- Custom Functions for Complex Operations
-- -----------------------------------------------------------------------------

-- Function to create an association, add creator as admin, and update profile
CREATE OR REPLACE FUNCTION public.create_association_and_set_admin(
    association_data jsonb,
    creator_id uuid
)
RETURNS json -- Returns the created association object or error info
LANGUAGE plpgsql
SECURITY DEFINER
-- Set search_path to prevent hijacking, adjust schema if needed
SET search_path = public, extensions
AS $$
DECLARE
    new_association_id uuid;
    created_association public.associations;
    current_user_role public.user_role_type;
    current_association_id uuid;
BEGIN
    -- Validate input data (basic checks)
    IF NOT (association_data ? 'name' AND association_data ? 'contact_email') THEN
        RETURN json_build_object('error', 'Missing required fields: name and contact_email');
    END IF;

    -- Check current user profile state
    SELECT role, association_id
    INTO current_user_role, current_association_id
    FROM public.profiles
    WHERE id = creator_id;

    -- Optional: Add check to prevent users already in an association from creating another one this way?
    -- IF current_association_id IS NOT NULL THEN
    --     RETURN json_build_object('error', 'User is already associated with an organization.');
    -- END IF;

    -- Insert the new association
    INSERT INTO public.associations (
        id, name, description, contact_email, contact_phone, website, address, logo, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(),
        association_data ->> 'name',
        association_data ->> 'description',
        association_data ->> 'contact_email',
        association_data ->> 'contact_phone',
        association_data ->> 'website',
        association_data ->> 'address',
        association_data ->> 'logo',
        timezone('utc', now()),
        timezone('utc', now())
    )
    RETURNING id INTO new_association_id;

    -- Add the creator as an admin member of the new association
    INSERT INTO public.association_members (user_id, association_id, role)
    VALUES (creator_id, new_association_id, 'admin');

    -- Update the creator's profile
    UPDATE public.profiles
    SET
        role = 'admin',
        association_id = new_association_id,
        updated_at = timezone('utc', now())
    WHERE id = creator_id;

    -- Log the action
    INSERT INTO public.audit_logs (action, entity, entity_id, user_id, changes)
    VALUES (
        'create_association_and_set_admin',
        'associations',
        new_association_id::text,
        creator_id,
        jsonb_build_object('association_data', association_data, 'user_role_set_to', 'admin')
    );

    -- Fetch the newly created association to return it
    SELECT * INTO created_association FROM public.associations WHERE id = new_association_id;

    -- Return the created association details as JSON
    RETURN row_to_json(created_association);

EXCEPTION
    WHEN others THEN
        -- Log the error (optional, depends on logging setup)
        -- RAISE WARNING 'Error in create_association_and_set_admin: %', SQLERRM;
        -- Return error information
        RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.create_association_and_set_admin(jsonb, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
-- profiles
CREATE INDEX idx_profiles_association_id ON public.profiles(association_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- association_members
CREATE INDEX idx_association_members_user_id ON public.association_members(user_id);
CREATE INDEX idx_association_members_association_id ON public.association_members(association_id);

-- association_invitations
CREATE INDEX idx_association_invitations_association_id ON public.association_invitations(association_id);
CREATE INDEX idx_association_invitations_code ON public.association_invitations(code);
CREATE INDEX idx_association_invitations_email ON public.association_invitations(email);

-- locations
CREATE INDEX idx_locations_association_id ON public.locations(association_id);
CREATE INDEX idx_locations_parent_id ON public.locations(parent_id);

-- categories
CREATE INDEX idx_categories_association_id ON public.categories(association_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- items
CREATE INDEX idx_items_association_id ON public.items(association_id);
CREATE INDEX idx_items_category_id ON public.items(category_id);
CREATE INDEX idx_items_location_id ON public.items(location_id);
CREATE INDEX idx_items_name ON public.items(name); -- For searching by name
CREATE INDEX idx_items_barcode ON public.items(barcode);
CREATE INDEX idx_items_serial_number ON public.items(serial_number);

-- equipment_sets
CREATE INDEX idx_equipment_sets_association_id ON public.equipment_sets(association_id);

-- equipment_set_items
CREATE INDEX idx_equipment_set_items_set_id ON public.equipment_set_items(set_id);
CREATE INDEX idx_equipment_set_items_item_id ON public.equipment_set_items(item_id);

-- documents
CREATE INDEX idx_documents_item_id ON public.documents(item_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

-- conventions
CREATE INDEX idx_conventions_association_id ON public.conventions(association_id);
CREATE INDEX idx_conventions_status ON public.conventions(status);
CREATE INDEX idx_conventions_start_date ON public.conventions(start_date);

-- convention_locations
CREATE INDEX idx_convention_locations_convention_id ON public.convention_locations(convention_id);

-- convention_equipment
CREATE INDEX idx_convention_equipment_convention_id ON public.convention_equipment(convention_id);
CREATE INDEX idx_convention_equipment_item_id ON public.convention_equipment(item_id);
CREATE INDEX idx_convention_equipment_location_id ON public.convention_equipment(convention_location_id);

-- convention_consumables
CREATE INDEX idx_convention_consumables_convention_id ON public.convention_consumables(convention_id);
CREATE INDEX idx_convention_consumables_item_id ON public.convention_consumables(item_id);
CREATE INDEX idx_convention_consumables_location_id ON public.convention_consumables(convention_location_id);

-- convention_requirements
CREATE INDEX idx_convention_requirements_convention_id ON public.convention_requirements(convention_id);
CREATE INDEX idx_convention_requirements_assigned_to ON public.convention_requirements(assigned_to);

-- convention_templates
CREATE INDEX idx_convention_templates_association_id ON public.convention_templates(association_id);

-- convention_logs
CREATE INDEX idx_convention_logs_convention_id ON public.convention_logs(convention_id);
CREATE INDEX idx_convention_logs_user_id ON public.convention_logs(user_id);

-- convention_access
CREATE INDEX idx_convention_access_convention_id ON public.convention_access(convention_id);
CREATE INDEX idx_convention_access_user_id ON public.convention_access(user_id);

-- convention_invitations
CREATE INDEX idx_convention_invitations_convention_id ON public.convention_invitations(convention_id);
CREATE INDEX idx_convention_invitations_code ON public.convention_invitations(code);

-- audit_logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- user_2fa
CREATE INDEX idx_user_2fa_user_id ON public.user_2fa(user_id);

-- chat_messages
CREATE INDEX idx_chat_messages_association_id ON public.chat_messages(association_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- module_manifests
CREATE INDEX idx_module_manifests_module_id ON public.module_manifests(module_id);

-- module_migrations
CREATE INDEX idx_module_migrations_module_id ON public.module_migrations(module_id);

-- module_configurations
CREATE INDEX idx_module_configurations_module_id ON public.module_configurations(module_id);
CREATE INDEX idx_module_configurations_association_id ON public.module_configurations(association_id);
CREATE INDEX idx_module_configurations_key ON public.module_configurations(key);

-- -----------------------------------------------------------------------------
-- Storage Buckets and Policies
-- -----------------------------------------------------------------------------
-- Note: Bucket creation is often done via the Supabase Dashboard UI,
-- but policies should be defined here or via UI.

-- Example Bucket: Association Logos ('logos')
-- Assumes bucket 'logos' exists and is public OR private with policies.
-- If private:
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', false) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow association admins to upload/update their own logo
CREATE POLICY "Association logo upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'logos' AND
        -- Check if user is admin of the association derived from the path (e.g., association_id/logo.png)
        public.has_role_or_higher('admin') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1)) AND
        -- Optional: Restrict file types and size
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 5000000 -- 5MB limit
    );

-- Policy: Allow association admins to update their own logo
CREATE POLICY "Association logo update" ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'logos' AND
        public.has_role_or_higher('admin') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1))
    );

-- Policy: Allow association admins to delete their own logo
CREATE POLICY "Association logo delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'logos' AND
        public.has_role_or_higher('admin') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1))
    );

-- Policy: Allow authenticated users to view logos (if bucket is private)
CREATE POLICY "Association logo view" ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'logos');


-- Example Bucket: Profile Images ('profile-images')
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', false) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow users to upload/update/delete their own profile image
-- Split into separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Profile image insert" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images' AND
        -- Path should be user_id/filename.ext
        auth.uid() = uuid(split_part(name, '/', 1)) AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 2000000 -- 2MB limit
    );

CREATE POLICY "Profile image update" ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        auth.uid() = uuid(split_part(name, '/', 1))
    )
    WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.uid() = uuid(split_part(name, '/', 1)) AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 2000000 -- 2MB limit
    );

CREATE POLICY "Profile image delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        auth.uid() = uuid(split_part(name, '/', 1))
    );


-- Policy: Allow authenticated users to view profile images
CREATE POLICY "Profile image view" ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'profile-images');


-- Example Bucket: Item Images ('item-images')
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', false) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow managers+ to upload item images for their association
CREATE POLICY "Item image upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'item-images' AND
        -- Path: association_id/item_id/filename.ext
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1)) AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 10000000 -- 10MB limit
    );

-- Policy: Allow managers+ to delete item images for their association
CREATE POLICY "Item image delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1))
    );

-- Policy: Allow members to view item images for their association
CREATE POLICY "Item image view" ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.is_member_of_association(uuid(split_part(name, '/', 1)))
    );


-- Example Bucket: Documents ('documents')
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow users to upload documents they are allowed to create records for
-- MODIFIED: Check role within the specific association from the path
CREATE POLICY "Document upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'YOUR_DOCUMENTS_BUCKET_UUID' AND -- <<< IMPORTANT: Replace with your actual bucket UUID >>>
        -- Path: association_id/item_id/filename.ext
        public.has_role_or_higher_in_association(uuid(split_part(name, '/', 1)), 'manager') AND -- Use the new function
        -- No longer need public.get_my_association_id() check as the role check implicitly verifies membership
        (metadata ->> 'size')::bigint < 50000000 -- 50MB limit
    );

-- Policy: Allow users to delete documents they uploaded (or admins)
-- MODIFIED: Check role within the specific association from the path
CREATE POLICY "Document delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'YOUR_DOCUMENTS_BUCKET_UUID' AND -- <<< IMPORTANT: Replace with your actual bucket UUID >>>
        (
            -- Allow association admins/managers of the specific association
            public.has_role_or_higher_in_association(uuid(split_part(name, '/', 1)), 'manager')
            -- OR Check if user is the uploader via the documents table (requires joining or a function - more complex)
            -- Example (requires a function like get_document_uploader(object_name text)): 
            -- OR auth.uid() = public.get_document_uploader(name)
        )
    );

-- Policy: Allow users to view documents linked to items they can access
-- MODIFIED: Check membership in the specific association from the path
CREATE POLICY "Document view" ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'YOUR_DOCUMENTS_BUCKET_UUID' AND -- <<< IMPORTANT: Replace with your actual bucket UUID >>>
        -- Check if user is a member of the association derived from the path
        public.is_member_of_association(uuid(split_part(name, '/', 1)))
    );

-- -----------------------------------------------------------------------------
-- Final Setup Notes
-- -----------------------------------------------------------------------------
-- 1. Run this entire script in the Supabase SQL Editor.
-- 2. Create the required Storage buckets ('logos', 'profile-images', 'item-images', 'documents') via the Supabase Dashboard if they don't exist.
-- 3. **IMPORTANT**: After this script succeeds, run the `super_admin.sql` script
--    to assign the 'super_admin' role to your initial user account.
-- =============================================================================
-- End of Schema Script
-- =============================================================================