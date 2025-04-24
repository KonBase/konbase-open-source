-- Migration: Update convention attendees and permissions management
-- Date: 2025-04-25

-- Create convention role enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'convention_role_type') THEN
        CREATE TYPE public.convention_role_type AS ENUM (
            'organizer',
            'staff',
            'helper',
            'attendee'
        );
    END IF;
END
$$;

-- Add role column to convention_access table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'convention_access'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.convention_access 
        ADD COLUMN role public.convention_role_type NOT NULL DEFAULT 'attendee';
    END IF;
END
$$;

-- Create helper functions for permissions

-- Function to check if user can access a specific convention
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

-- Function to check if user can manage a convention
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

-- Add updated_at column and timestamp trigger to convention_access if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'convention_access'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.convention_access 
        ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
        
        CREATE TRIGGER set_convention_access_timestamp
        BEFORE UPDATE ON public.convention_access
        FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
    END IF;
END
$$;

-- RLS Policies - Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can view convention access" ON public.convention_access;
DROP POLICY IF EXISTS "Members can view own access record" ON public.convention_access;
DROP POLICY IF EXISTS "Managers can manage convention access" ON public.convention_access;
DROP POLICY IF EXISTS "Super admins can manage all convention access" ON public.convention_access;

-- RLS Policies - Add updated policies
CREATE POLICY "Members can view convention access" ON public.convention_access
FOR SELECT
USING (
  can_access_convention(convention_id)
);

CREATE POLICY "Members can view own access record" ON public.convention_access
FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Managers can manage convention access" ON public.convention_access
FOR ALL
USING (
  can_manage_convention(convention_id)
)
WITH CHECK (
  can_manage_convention(convention_id)
);

CREATE POLICY "Super admins can manage all convention access" ON public.convention_access
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Update convention_invitations table to include role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'convention_invitations'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.convention_invitations 
        ADD COLUMN role public.convention_role_type NOT NULL DEFAULT 'attendee';
    END IF;
END
$$;

-- RLS Policies for convention_invitations - Drop existing if they exist
DROP POLICY IF EXISTS "Managers can create convention invitations" ON public.convention_invitations;
DROP POLICY IF EXISTS "Managers can view convention invitations" ON public.convention_invitations;
DROP POLICY IF EXISTS "Super admins can manage all convention invitations" ON public.convention_invitations;

-- RLS Policies - Add updated policies
CREATE POLICY "Managers can create convention invitations" ON public.convention_invitations
FOR INSERT
WITH CHECK (
  can_manage_convention(convention_id) AND created_by = auth.uid()
);

CREATE POLICY "Managers can view convention invitations" ON public.convention_invitations
FOR SELECT
USING (
  can_manage_convention(convention_id)
);

CREATE POLICY "Super admins can manage all convention invitations" ON public.convention_invitations
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Add a policy to let users use valid invitations
CREATE POLICY "Allow users to view/use convention invitations" ON public.convention_invitations
FOR SELECT
USING (auth.role() = 'authenticated' AND expires_at > now() AND uses_remaining > 0);