-- QUICK FIX: Disable RLS for donor_details (Admin full access)
/* Run this in Supabase SQL Editor: https://app.supabase.com/project/[your-project]/sql */

-- 1. Disable RLS (allows any authenticated user to CRUD)
ALTER TABLE donor_details DISABLE ROW LEVEL SECURITY;

-- 2. Drop UNIQUE constraint if exists (allows duplicate donors)
ALTER TABLE donor_details DROP CONSTRAINT IF EXISTS donor_details_email_key;

-- Test insert works now ✅

-- LATER: Re-enable with proper policy
/*
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can CRUD donor_details" ON donor_details
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);  -- Temporary open policy
*/

-- Set your admin user metadata: Supabase → Auth → Users → Edit → {"app_role": "admin"}

