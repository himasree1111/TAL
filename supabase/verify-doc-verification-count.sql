-- Verification queries for doc_verification_count feature
-- Run these in Supabase SQL Editor to test and verify the feature

-- 1. Verify column was added successfully
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'eligible_students' 
  AND column_name = 'doc_verification_count';

-- 2. Check all students with their verification counts
SELECT 
  es.id,
  es.student_public_id,
  es.student_name,
  es.email,
  es.doc_verification_count,
  es.class,
  es.school,
  es.created_at
FROM eligible_students es
ORDER BY es.doc_verification_count DESC, es.created_at DESC;

-- 3. Find students who have been verified but NOT in fee_tracking
-- These should be added to fee_tracking on next verification
SELECT 
  es.email,
  es.student_name,
  es.doc_verification_count,
  ft.id as fee_tracking_id
FROM eligible_students es
LEFT JOIN fee_tracking ft ON es.email = ft.email
WHERE es.doc_verification_count > 0
  AND ft.id IS NULL;

-- 4. Check fee_tracking records with their verification counts
SELECT 
  ft.student_public_id,
  ft.student_name,
  ft.email,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.total_paid_by_tal,
  ft.fee_status,
  ft.voucher_url,
  ft.updated_at,
  es.doc_verification_count
FROM fee_tracking ft
INNER JOIN eligible_students es ON ft.email = es.email
ORDER BY ft.updated_at DESC;

-- 5. Verify data consistency between student_form_submissions and fee_tracking
SELECT 
  s.id as form_id,
  s.student_public_id,
  s.full_name as form_name,
  ft.student_name as tracking_name,
  s.total_educational_expenses as form_expenses,
  ft.total_educational_expenses as tracking_expenses,
  s.email,
  CASE 
    WHEN s.total_educational_expenses = ft.total_educational_expenses 
    THEN '✓ Match' 
    ELSE '✗ Mismatch' 
  END as expenses_match
FROM student_form_submissions s
INNER JOIN fee_tracking ft ON s.id = ft.student_form_id
LIMIT 20;

-- 6. Check students with vouchers and their verification counts
SELECT 
  ft.student_name,
  ft.email,
  ft.voucher_url,
  ft.fee_paid_by_tal,
  ft.fee_status,
  es.doc_verification_count,
  ft.updated_at
FROM fee_tracking ft
INNER JOIN eligible_students es ON ft.email = es.email
WHERE ft.voucher_url IS NOT NULL
ORDER BY ft.updated_at DESC;

-- 7. Verify payment status calculation is correct
SELECT 
  ft.student_name,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.fee_status,
  ft.balance_due,
  (ft.total_educational_expenses - COALESCE(ft.fee_paid_by_tal, 0)) as calculated_balance,
  CASE 
    WHEN ft.fee_paid_by_tal = 0 THEN 'Pending'
    WHEN ft.fee_paid_by_tal >= ft.total_educational_expenses AND ft.total_educational_expenses > 0 THEN 'Paid'
    ELSE 'Partial'
  END as calculated_status,
  CASE 
    WHEN ft.fee_status = (
      CASE 
        WHEN ft.fee_paid_by_tal = 0 THEN 'Pending'
        WHEN ft.fee_paid_by_tal >= ft.total_educational_expenses AND ft.total_educational_expenses > 0 THEN 'Paid'
        ELSE 'Partial'
      END
    ) THEN '✓ Correct' 
    ELSE '✗ Wrong' 
  END as status_check
FROM fee_tracking ft
LIMIT 20;

-- 8. Summary statistics
SELECT 
  COUNT(*) as total_eligible_students,
  COUNT(CASE WHEN doc_verification_count = 0 THEN 1 END) as never_verified,
  COUNT(CASE WHEN doc_verification_count = 1 THEN 1 END) as verified_once,
  COUNT(CASE WHEN doc_verification_count = 2 THEN 1 END) as verified_twice,
  COUNT(CASE WHEN doc_verification_count > 2 THEN 1 END) as verified_many_times,
  MAX(doc_verification_count) as max_verifications,
  AVG(doc_verification_count) as avg_verifications
FROM eligible_students;

-- 9. Fee tracking summary
SELECT 
  COUNT(*) as total_in_fee_tracking,
  COUNT(CASE WHEN fee_status = 'Pending' THEN 1 END) as pending,
  COUNT(CASE WHEN fee_status = 'Partial' THEN 1 END) as partial,
  COUNT(CASE WHEN fee_status = 'Paid' THEN 1 END) as paid,
  SUM(total_educational_expenses) as total_expenses,
  SUM(fee_paid_by_tal) as total_paid,
  SUM(balance_due) as total_balance,
  COUNT(CASE WHEN voucher_url IS NOT NULL THEN 1 END) as with_vouchers
FROM fee_tracking;

-- 10. Test: Manually increment verification count for testing
-- Uncomment and run to test a specific student:
-- UPDATE eligible_students 
-- SET doc_verification_count = doc_verification_count + 1
-- WHERE email = 'test@example.com'
-- RETURNING email, student_name, doc_verification_count;

-- 11. Find students who need fee_tracking updates
-- Students with verified documents but no fee_tracking record
SELECT 
  s.id as student_form_id,
  s.student_public_id,
  s.full_name,
  s.email,
  s.total_educational_expenses,
  COUNT(DISTINCT sd.category) as verified_categories
FROM student_form_submissions s
INNER JOIN student_documents sd ON s.id = sd.student_id
LEFT JOIN fee_tracking ft ON s.id = ft.student_form_id
WHERE sd.is_checked = true
  AND sd.category IN ('academic', 'personal', 'extracurricular')
  AND ft.id IS NULL
GROUP BY s.id, s.student_public_id, s.full_name, s.email, s.total_educational_expenses
HAVING COUNT(DISTINCT sd.category) >= 1;

-- 12. Check for any orphaned fee_tracking records
-- Records in fee_tracking but not in eligible_students
SELECT 
  ft.id,
  ft.student_public_id,
  ft.student_name,
  ft.email,
  'No matching eligible_students record' as issue
FROM fee_tracking ft
LEFT JOIN eligible_students es ON ft.email = es.email
WHERE es.id IS NULL;
