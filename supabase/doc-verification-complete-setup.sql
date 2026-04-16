-- Document Verification Count & Fee Tracking Complete Setup
-- Run this ENTIRE file in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
-- This sets up the complete feature from scratch

-- ========================================
-- STEP 1: Add doc_verification_count column (REQUIRED FIRST)
-- ========================================
ALTER TABLE eligible_students 
ADD COLUMN IF NOT EXISTS doc_verification_count integer DEFAULT 0;

-- Note: Supabase doesn't support IF NOT EXISTS for constraints. Run manually if needed:
-- ALTER TABLE eligible_students ADD CONSTRAINT doc_verification_count_check CHECK (doc_verification_count >= 0);

CREATE INDEX IF NOT EXISTS idx_eligible_students_doc_verification_count 
ON eligible_students(doc_verification_count);

-- Update existing records
UPDATE eligible_students 
SET doc_verification_count = 0 
WHERE doc_verification_count IS NULL;

-- ========================================
-- STEP 2: Verify column was added + check constraint status
-- ========================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'eligible_students' 
  AND column_name = 'doc_verification_count';

-- Check constraint status
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'eligible_students'::regclass 
  AND conname LIKE '%doc_verification_count%';

-- ========================================
-- STEP 3: Test Queries (Run these after testing UI)
-- ========================================
-- Check verification counts
SELECT 
  email, 
  student_name, 
  doc_verification_count,
  class
FROM eligible_students
WHERE doc_verification_count > 0
ORDER BY doc_verification_count DESC, created_at DESC;

-- Check fee_tracking with verification counts  
SELECT 
  ft.student_public_id,
  ft.student_name,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.fee_status,
  ft.voucher_url,
  ft.updated_at,
  es.doc_verification_count
FROM fee_tracking ft
INNER JOIN eligible_students es ON ft.email = es.email
WHERE es.doc_verification_count > 0
ORDER BY ft.updated_at DESC;

-- Students verified but missing fee_tracking
SELECT 
  es.email,
  es.student_name,
  es.doc_verification_count,
  ft.id as fee_tracking_id
FROM eligible_students es
LEFT JOIN fee_tracking ft ON es.email = ft.email
WHERE es.doc_verification_count > 0
  AND ft.id IS NULL;

-- Verification statistics
SELECT 
  COUNT(*) as total_eligible_students,
  COUNT(CASE WHEN doc_verification_count = 0 THEN 1 END) as never_verified,
  COUNT(CASE WHEN doc_verification_count = 1 THEN 1 END) as verified_once,
  COUNT(CASE WHEN doc_verification_count = 2 THEN 1 END) as verified_twice,
  COUNT(CASE WHEN doc_verification_count > 2 THEN 1 END) as verified_many_times,
  MAX(doc_verification_count) as max_verifications,
  AVG(doc_verification_count) as avg_verifications
FROM eligible_students;

-- ========================================
-- STEP 4: Manual test (uncomment to test increment)
-- ========================================
-- UPDATE eligible_students
-- SET doc_verification_count = doc_verification_count + 1
-- WHERE email = 'test@example.com'
-- RETURNING email, student_name, doc_verification_count;

SELECT '✅ Setup complete! Column added successfully. Test the UI now.' as status;
SELECT 'Expected: doc_verification_count column exists with default 0 and check constraint.' as next_steps;
