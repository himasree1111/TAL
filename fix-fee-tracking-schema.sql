-- 🚀 FIX FEE TRACKING INSERT ISSUE
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)

-- 1️⃣ ADD MISSING COLUMN (ROOT CAUSE)
ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS student_form_id BIGINT,
ADD COLUMN IF NOT EXISTS required_fee NUMERIC(10,2) DEFAULT 0;

-- 2️⃣ CREATE INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_fee_tracking_student_form_id 
ON fee_tracking(student_form_id);

CREATE INDEX IF NOT EXISTS idx_fee_tracking_email 
ON fee_tracking(email);

-- 3️⃣ UPDATE RLS POLICY (Admin full access)
DROP POLICY IF EXISTS "admin_view" ON fee_tracking;
DROP POLICY IF EXISTS "admin_insert" ON fee_tracking;
DROP POLICY IF EXISTS "admin_update" ON fee_tracking;
DROP POLICY IF EXISTS "admin_delete" ON fee_tracking;

CREATE POLICY "Admin full access fee_tracking" ON fee_tracking
FOR ALL USING (auth.jwt() ->> 'user_type' = 'admin')
WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- 4️⃣ RE-CREATE RPC with FIXED column order
DROP FUNCTION IF EXISTS populate_fee_tracking_safe();

CREATE OR REPLACE FUNCTION populate_fee_tracking_safe()
RETURNS json AS $$
DECLARE
  result json;
  inserted_count int;
BEGIN
  -- Insert students with ALL 3 doc categories verified (excludes fee_receipt)
  INSERT INTO fee_tracking (
    student_form_id, student_public_id, student_name, email, 
    whatsapp_number, camp_name, camp_date, education, school, branch,
    total_educational_expenses, fee_paid_by_tal, created_at, updated_at
  )
  SELECT 
    s.id, s.student_public_id, s.full_name, s.email,
    s.whatsapp, s.camp_name, s.camp_date,
    COALESCE(s.educationcategory, s.class, s.course, '') as education,
    s.school, s.branch,
    COALESCE(s.total_educational_expenses, 0) as total_educational_expenses, -- Default fee
    0, NOW(), NOW()
  FROM student_form_submissions s
  WHERE NOT EXISTS (
    SELECT 1 FROM fee_tracking ft WHERE ft.student_form_id = s.id
  )
  AND s.id IN (
    -- Students with ALL 3 categories verified
    SELECT sd.student_id
    FROM student_documents sd
    WHERE sd.category IN ('academic', 'personal', 'extracurricular')
      AND sd.is_checked = true
    GROUP BY sd.student_id
    HAVING COUNT(DISTINCT sd.category) = 3
  )
  ON CONFLICT (student_form_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  SELECT json_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'total_records', (SELECT COUNT(*)::int FROM fee_tracking),
    'message', format('Added %s new fee tracking records', inserted_count)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION populate_fee_tracking_safe() TO authenticated, service_role;

-- 🧪 TEST COMMANDS (Run after above)
-- SELECT populate_fee_tracking_safe();
-- SELECT * FROM fee_tracking ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) FROM fee_tracking WHERE fee_paid_by_tal = 0;

-- 🎉 SUCCESS MARKERS:
-- ✅ "inserted_count": 1+
-- ✅ New records in fee_tracking table
-- ✅ AdminDashboard Fee Tracking tab shows records

