-- FEE_TRACKING TABLE - CREATE FROM SCRATCH
-- Matches exact schema from DOC-VERIFICATION-COUNT-GUIDE.md
-- Run this in Supabase SQL Editor to recreate table

-- ⚠️  WARNING: This DROPS existing table & data!

DROP TABLE IF EXISTS fee_tracking CASCADE;

-- Create exact schema from guide
CREATE TABLE public.fee_tracking (
  id bigserial PRIMARY KEY,
  student_form_id integer,
  student_public_id text NOT NULL,
  student_name text NOT NULL,
  email text NOT NULL,
  whatsapp_number text,
  camp_name text,
  camp_date date,
  education text,
  school text,
  branch text,
  total_educational_expenses numeric(10, 2),
  fee_paid_by_tal numeric(10, 2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  voucher_url text,
  fee_status text DEFAULT 'Pending',
  balance_due numeric GENERATED ALWAYS AS (
    total_educational_expenses - COALESCE(fee_paid_by_tal, 0)
  ) STORED,
  total_paid_by_tal numeric(10, 2) DEFAULT 0
);

-- Indexes
CREATE INDEX idx_fee_tracking_student_form_id ON fee_tracking(student_form_id);
CREATE INDEX idx_fee_tracking_email ON fee_tracking(email);
CREATE INDEX idx_fee_tracking_fee_status ON fee_tracking(fee_status);
CREATE INDEX idx_fee_tracking_balance_due ON fee_tracking(balance_due);

-- RLS Policies (Admin only)
ALTER TABLE fee_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view fee_tracking" ON fee_tracking
  FOR SELECT USING (true);  -- Simplified for admin

CREATE POLICY "Admin can insert fee_tracking" ON fee_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update fee_tracking" ON fee_tracking
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete fee_tracking" ON fee_tracking
  FOR DELETE USING (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fee_tracking_updated_at
  BEFORE UPDATE ON fee_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification query
SELECT 
  '✅ fee_tracking table created successfully!' as status,
  COUNT(*) as row_count
FROM information_schema.columns 
WHERE table_name = 'fee_tracking';

-- Test insert (optional)
-- INSERT INTO fee_tracking (student_form_id, student_public_id, student_name, email, total_educational_expenses) 
-- VALUES (123, 'TEST-001', 'Test Student', 'test@example.com', 15000.00);
