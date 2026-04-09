-- FINAL Clean SQL for Supabase - COPY PASTE & RUN THIS

-- 1. Drop if exists
DROP TABLE IF EXISTS fee_tracking CASCADE;

-- 2. Create table with ALL requested fields (denormalized)
CREATE TABLE fee_tracking (
  id BIGSERIAL PRIMARY KEY,
  student_public_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT,
  camp_name TEXT,
  camp_date DATE,
  education TEXT,
  school TEXT,
  branch TEXT,
  total_educational_expenses NUMERIC(10,2),
  fee_paid_by_tal NUMERIC(10,2) DEFAULT 0 CHECK (fee_paid_by_tal >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_fee_tracking_student_public_id ON fee_tracking(student_public_id);
CREATE INDEX idx_fee_tracking_paid ON fee_tracking(fee_paid_by_tal);

-- 4. Enable RLS
ALTER TABLE fee_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Admin policies (simple, matches app logic)
CREATE POLICY admin_view ON fee_tracking FOR SELECT USING (auth.jwt() ->> 'user_type' = 'admin');
CREATE POLICY admin_insert ON fee_tracking FOR INSERT WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');
CREATE POLICY admin_update ON fee_tracking FOR UPDATE USING (auth.jwt() ->> 'user_type' = 'admin');
CREATE POLICY admin_delete ON fee_tracking FOR DELETE USING (auth.jwt() ->> 'user_type' = 'admin');

-- 6. Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER trg_fee_tracking_updated_at BEFORE UPDATE ON fee_tracking
FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

-- ✅ VERIFY (run these one by one if needed)
-- SELECT * FROM fee_tracking LIMIT 1;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fee_tracking' ORDER BY ordinal_position;
-- SELECT * FROM pg_policies WHERE tablename = 'fee_tracking';

-- Test INSERT (uncomment & run as admin):
-- INSERT INTO fee_tracking (student_public_id, student_name, email, fee_paid_by_tal, total_educational_expenses) VALUES ('TEST1', 'Test Student', 'test@example.com', 2500.00, 15000.00);
-- SELECT * FROM fee_tracking ORDER BY created_at DESC LIMIT 5;

-- Test data (admin only):
-- INSERT INTO fee_tracking (student_public_id, student_name, email, fee_paid_by_tal, total_educational_expenses) VALUES ('TEST1', 'Test Student', 'test@example.com', 2500.00, 15000.00);
-- SELECT * FROM fee_tracking;
