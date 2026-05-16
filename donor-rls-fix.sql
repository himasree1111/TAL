-- DONOR RLS POLICIES FIX
-- Run this in Supabase SQL Editor to allow anon users to insert/update donors

-- Step 1: Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Allow authenticated access to donor_details" ON donor_details;
DROP POLICY IF EXISTS "Allow anon select on donor_details" ON donor_details;

-- Step 2: Create permissive policies for anon users (the app uses anon key)
-- Allow anon users to SELECT
CREATE POLICY "Allow anon select on donor_details" ON donor_details
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to INSERT new donors
CREATE POLICY "Allow anon insert on donor_details" ON donor_details
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to UPDATE existing donors
CREATE POLICY "Allow anon update on donor_details" ON donor_details
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to DELETE donors
CREATE POLICY "Allow anon delete on donor_details" ON donor_details
  FOR DELETE
  TO anon
  USING (true);

-- Step 3: Also allow authenticated users (for consistency)
CREATE POLICY "Allow authenticated full access to donor_details" ON donor_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;
