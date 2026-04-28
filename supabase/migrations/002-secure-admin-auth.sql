-- SECURE ADMIN AUTH MIGRATION
-- Removes plain text password storage and links admins to Supabase Auth users
-- Run this in Supabase SQL Editor

-- 1. Add auth_id column to link admins to Supabase Auth users
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_auth_id ON admins(auth_id);

-- 3. Drop the plain text password column (SECURITY FIX)
-- WARNING: This permanently removes all plain text passwords. 
-- Ensure admin can still log in via Supabase Auth before running this.
ALTER TABLE admins
DROP COLUMN IF EXISTS password;

-- 4. Verify new structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- 5. Post-migration: Link existing admin to Supabase Auth user
-- After creating the admin user in Supabase Auth dashboard, run:
-- UPDATE admins SET auth_id = 'AUTH_USER_UUID_HERE' WHERE email = 'info@touchalifeorg.com';

