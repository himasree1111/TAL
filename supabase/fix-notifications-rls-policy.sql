-- ============================================================
-- FIX: Notifications RLS Policy for Custom Auth
-- Run this in Supabase SQL Editor
-- ============================================================
-- 
-- PROBLEM:
-- The app uses custom admin auth (localStorage token) instead of 
-- Supabase Auth sessions. When the Supabase client uses the anon key,
-- the JWT role is always "anon", not "authenticated".
-- The current policy only allows:
--   - authenticated: ALL (but no Supabase session exists)
--   - anon: SELECT only
--
-- This causes "new row violates row-level security policy 
-- for table 'notifications'" when trying to INSERT.
--
-- SOLUTION:
-- Allow anon role full CRUD access (application handles auth)
-- ============================================================

-- Step 1: Drop the existing anon SELECT-only policy
DROP POLICY IF EXISTS "Anon users can read notifications" ON public.notifications;

-- Step 2: Create new policy allowing anon full access
-- This follows the same pattern as donor-setup.sql fix
CREATE POLICY "Allow anon full access to notifications" ON public.notifications
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Step 3: Also ensure authenticated has full access
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON public.notifications;
CREATE POLICY "Allow authenticated full access to notifications" ON public.notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VERIFY:
-- After running, test by creating a notification from AdminDashboard.
-- Should succeed without RLS policy error.
-- ============================================================
