-- FIXED: Proper Supabase Policies for donor_details
-- Run ALL in Supabase SQL Editor: https://app.supabase.com/project/[your-project]/sql

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- The original policy used: auth.jwt() ->> 'role' = 'admin'
-- This DOES NOT WORK because Supabase JWTs always have role = 'authenticated'
-- or 'anon'. The 'admin' value never appears in auth.jwt() ->> 'role'.
-- Since this app uses custom admin auth (localStorage token, not Supabase
-- Auth session), queries to donor_details silently returned empty arrays.

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- 1. Drop the broken policy
DROP POLICY IF EXISTS "Admins can CRUD donor_details" ON donor_details;

-- 2. Ensure RLS is enabled
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;

-- 3. Create working policies
--    Authenticated users get full CRUD access
--    Anon users get SELECT access (for custom auth flow compatibility)
CREATE POLICY "Allow authenticated access to donor_details" ON donor_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon select on donor_details" ON donor_details
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- TEST
-- ============================================================================
-- After running, verify with:
-- SELECT * FROM donor_details; -- Should return rows

-- ============================================================================
-- ALTERNATIVE: If you want stricter security
-- ============================================================================
-- Option A: Store admin email in a config table and check against it
-- Option B: Use Supabase Auth for admin login (set user_type = 'admin' in
--           user_metadata, then check auth.jwt() -> 'user_metadata' ->> 'user_type')
-- Option C: Use a service_role key for admin operations (server-side only)

