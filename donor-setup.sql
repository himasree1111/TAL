-- Supabase Donor Table Setup (run in SQL Editor at app.supabase.com)

-- 1. Create donors table
CREATE TABLE donor_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT,  -- optional
  phone TEXT,
  email TEXT UNIQUE,
  donor_type TEXT CHECK (donor_type IN ('Individual', 'Organization')) NOT NULL,
  organization_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('UPI', 'Bank Transfer', 'Cash', 'Card')) NOT NULL,
  transaction_id TEXT,
  donation_type TEXT CHECK (donation_type IN ('One-time', 'Monthly', 'Yearly')) NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (Admin full access)
CREATE POLICY "Admins can CRUD donor_details" ON donor_details
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- 4. Indexes
CREATE INDEX idx_donor_details_email ON donor_details(email);
CREATE INDEX idx_donor_details_date ON donor_details(donation_date);
CREATE INDEX idx_donor_details_type ON donor_details(donor_type);

-- 5. Sample data
INSERT INTO donor_details (full_name, gender, phone, email, donor_type, organization_name, amount, payment_method, transaction_id, donation_type) VALUES
('John Doe', 'Male', '+919876543210', 'john@example.com', 'Individual', NULL, 5000.00, 'UPI', 'UPI123456', 'One-time'),
('ABC Foundation', NULL, '+919112233445', 'contact@abcfoundation.org', 'Organization', 'ABC Foundation', 25000.00, 'Bank Transfer', 'TXN789', 'Monthly');
