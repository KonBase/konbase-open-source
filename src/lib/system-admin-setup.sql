
-- This SQL script sets up the system_admin role and related RLS policies
-- Execute these queries in your Supabase SQL editor

-- 1. First, ensure the profiles table has the correct role enum type
-- Check if the enum type exists and alter it to include system_admin
DO $$ 
BEGIN
  -- Check if the enum type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    -- Check if system_admin is already a value in the enum
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
      AND enumlabel = 'system_admin'
    ) THEN
      -- Add system_admin to the enum
      ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'system_admin';
    END IF;
  ELSE
    -- Create the enum type if it doesn't exist
    CREATE TYPE user_role_enum AS ENUM ('super_admin', 'system_admin', 'admin', 'manager', 'member', 'guest');
  END IF;
  
  -- Check if there's a check constraint on the profiles table for roles
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'valid_profile_role' AND conrelid = 'profiles'::regclass
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_profile_role;
    
    -- Recreate the constraint with the updated values
    ALTER TABLE profiles ADD CONSTRAINT valid_profile_role 
      CHECK (role IN ('super_admin', 'system_admin', 'admin', 'manager', 'member', 'guest'));
  END IF;
END $$;

-- 2. Update RLS policies for the profiles table to include system_admin
-- First, drop the existing admin-specific policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Now create updated policies that include system_admin
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'authenticated' AND 
         (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin', 'super_admin'));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'authenticated' AND 
         (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin', 'super_admin'));

-- 3. Update RLS policies for admin-specific tables
-- First for audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'authenticated' AND 
         (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin'));

-- 4. Update RLS policies for associations table to grant system_admin access
DROP POLICY IF EXISTS "Admins can manage all associations" ON associations;
CREATE POLICY "Admins can manage all associations"
  ON associations
  USING (auth.jwt() ->> 'role' = 'authenticated' AND 
         (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin', 'super_admin'));

-- 5. Update the association_members policies
DROP POLICY IF EXISTS "Admin users can manage all memberships" ON association_members;
CREATE POLICY "Admin users can manage all memberships"
  ON association_members
  USING (auth.jwt() ->> 'role' = 'authenticated' AND 
         (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin', 'super_admin'));

-- 6. Create a function to check if a user has system_admin or super_admin role
CREATE OR REPLACE FUNCTION public.has_elevated_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role IN ('system_admin', 'super_admin');
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
