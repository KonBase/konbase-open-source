-- =============================================================================
-- Grant Super Admin Privileges
-- =============================================================================
-- This script grants the 'super_admin' role to a specific user.
-- Run this script *after* executing the main `schema.sql` script.

-- -----------------------------------------------------------------------------
-- Instructions:
-- -----------------------------------------------------------------------------
-- 1. Sign up a new user in your Supabase project using the application or Supabase Auth UI.
-- 2. Find the `user_id` (UUID) of the user you want to make a super admin.
--    You can find this in the Supabase Dashboard under Authentication -> Users,
--    or by querying the `auth.users` table.
-- 3. Replace `'YOUR_USER_ID_HERE'` in the UPDATE statement below with the actual user ID.
-- 4. Execute this script using the Supabase SQL Editor.

-- -----------------------------------------------------------------------------
-- New Setup Process:
-- -----------------------------------------------------------------------------
-- 1. Navigate to the Supabase Dashboard -> SQL Editor.
-- 2. Create a "New query".
-- 3. Copy the entire content of `schema.sql` and paste it into the editor.
-- 4. Run the query to set up the database schema, tables, roles, and RLS policies.
-- 5. Create another "New query".
-- 6. Copy the content of this file (`super_admin.sql`), replace the placeholder
--    user ID with the correct one, and paste it into the editor.
-- 7. Run the query to grant super admin privileges to the specified user.
-- 8. The application should now be ready to use with the designated super admin.
-- -----------------------------------------------------------------------------

-- Update the user's profile to grant super_admin role
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = 'YOUR_USER_ID_HERE'; -- <<< IMPORTANT: Replace this with the actual user ID (UUID)

-- Optional: Verify the change (uncomment the line below to run)
-- SELECT id, email, role FROM public.profiles WHERE id = 'YOUR_USER_ID_HERE';

-- =============================================================================
-- End of Script
-- =============================================================================
