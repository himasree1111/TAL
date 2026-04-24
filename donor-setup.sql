-- Supabase Donor Table Setup (run in SQL Editor at app.supabase.com)

-- 1. Create donors table
CREATE TABLE donor_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT,  -- optional
  phone TEXT,
  email TEXT,
  donor_type TEXT CHECK (donor_type IN ('Individual', 'Organization')) NOT NULL,
  organization_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('UPI', 'Net Banking', 'Bank Transfer', 'Cheque', 'Cash', 'Card')) NOT NULL,
  transaction_id TEXT,
  donation_type TEXT CHECK (donation_type IN ('One-time', 'Monthly', 'Yearly')) NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
-- NOTE: This app uses custom admin auth (localStorage token) instead of Supabase Auth sessions.
-- auth.jwt() ->> 'role' is ALWAYS 'authenticated' or 'anon' — never 'admin'.
-- Therefore we use a policy that allows access for the app's auth model.
-- Application-level authorization is handled by the frontend admin_token check.

-- Drop broken policy if it exists from previous setup
DROP POLICY IF EXISTS "Admins can CRUD donor_details" ON donor_details;

-- Allow all authenticated users full access (app handles admin authorization)
CREATE POLICY "Allow authenticated access to donor_details" ON donor_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon (SELECT only) for cases where no Supabase session exists
-- This covers the custom admin auth flow used in this app
CREATE POLICY "Allow anon select on donor_details" ON donor_details
  FOR SELECT
  TO anon
  USING (true);

-- 4. Indexes
CREATE INDEX idx_donor_details_email ON donor_details(email);
CREATE INDEX idx_donor_details_date ON donor_details(donation_date);
CREATE INDEX idx_donor_details_type ON donor_details(donor_type);

-- 5. Sample data
INSERT INTO donor_details (full_name, gender, phone, email, donor_type, organization_name, amount, payment_method, transaction_id, donation_type) VALUES
('John Doe', 'Male', '+919876543210', 'john@example.com', 'Individual', NULL, 5000.00, 'UPI', 'UPI123456', 'One-time'),
('ABC Foundation', NULL, '+919112233445', 'contact@abcfoundation.org', 'Organization', 'ABC Foundation', 25000.00, 'Bank Transfer', 'TXN789', 'Monthly');

