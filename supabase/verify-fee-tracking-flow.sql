-- Quick verification and testing queries for fee_tracking flow
-- Run these in Supabase SQL Editor to verify everything works

-- 1. Check students with verified documents who are NOT in fee_tracking
-- These students should be auto-added when you verify their documents
SELECT 
  s.id as student_form_id,
  s.student_public_id,
  s.full_name,
  s.email,
  COUNT(DISTINCT sd.category) as verified_categories,
  STRING_AGG(DISTINCT sd.category, ', ') as categories
FROM student_form_submissions s
INNER JOIN student_documents sd ON s.id = sd.student_id
WHERE sd.is_checked = true
  AND sd.category IN ('academic', 'personal', 'extracurricular')
  AND NOT EXISTS (
    SELECT 1 FROM fee_tracking ft WHERE ft.student_form_id = s.id
  )
GROUP BY s.id, s.student_public_id, s.full_name, s.email
HAVING COUNT(DISTINCT sd.category) >= 1
ORDER BY s.created_at DESC;

-- 2. Check existing fee_tracking records
SELECT 
  ft.id,
  ft.student_public_id,
  ft.student_name,
  ft.email,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.total_paid_by_tal,
  ft.fee_status,
  ft.balance_due,
  ft.whatsapp_number,
  ft.camp_name,
  ft.education,
  ft.school,
  ft.created_at
FROM fee_tracking ft
ORDER BY ft.created_at DESC
LIMIT 20;

-- 3. Verify balance_due calculation is correct
SELECT 
  ft.student_name,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.balance_due,
  (ft.total_educational_expenses - COALESCE(ft.fee_paid_by_tal, 0)) as calculated_balance,
  CASE 
    WHEN ft.balance_due = (ft.total_educational_expenses - COALESCE(ft.fee_paid_by_tal, 0)) 
    THEN '✓ Correct' 
    ELSE '✗ Mismatch' 
  END as status
FROM fee_tracking ft
LIMIT 20;

-- 4. Check document verification status per student
SELECT 
  s.id as student_form_id,
  s.student_public_id,
  s.full_name,
  COUNT(sd.id) as total_docs,
  COUNT(CASE WHEN sd.is_checked = true THEN 1 END) as verified_docs,
  COUNT(CASE WHEN sd.is_checked = false THEN 1 END) as pending_docs,
  STRING_AGG(DISTINCT sd.category, ', ') as categories
FROM student_form_submissions s
LEFT JOIN student_documents sd ON s.id = sd.student_id
GROUP BY s.id, s.student_public_id, s.full_name
ORDER BY verified_docs DESC;

-- 5. Find students ready for fee_tracking (documents verified but not in fee_tracking)
SELECT 
  s.id as student_form_id,
  s.student_public_id,
  s.full_name,
  s.email,
  s.fee,
  s.total_educational_expenses,
  COUNT(DISTINCT sd.category) as verified_categories
FROM student_form_submissions s
INNER JOIN student_documents sd ON s.id = sd.student_id
WHERE sd.is_checked = true
  AND sd.category IN ('academic', 'personal', 'extracurricular')
  AND NOT EXISTS (
    SELECT 1 FROM fee_tracking ft WHERE ft.student_form_id = s.id
  )
GROUP BY s.id, s.student_public_id, s.full_name, s.email, s.fee, s.total_educational_expenses
HAVING COUNT(DISTINCT sd.category) >= 2;

-- 6. Test: Manually populate fee_tracking for verified students
-- Uncomment and run this to populate fee_tracking for existing verified students:
-- SELECT populate_fee_tracking_from_verified();

-- 7. Verify fee_tracking schema has all required columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'fee_tracking'
ORDER BY ordinal_position;

-- 8. Check for any duplicate fee_tracking records
SELECT 
  student_form_id,
  COUNT(*) as record_count
FROM fee_tracking
GROUP BY student_form_id
HAVING COUNT(*) > 1;

-- 9. Summary statistics
SELECT 
  COUNT(*) as total_students_in_fee_tracking,
  COUNT(CASE WHEN fee_status = 'Pending' THEN 1 END) as pending,
  COUNT(CASE WHEN fee_status = 'Partial' THEN 1 END) as partial,
  COUNT(CASE WHEN fee_status = 'Paid' THEN 1 END) as paid,
  SUM(total_educational_expenses) as total_expenses,
  SUM(fee_paid_by_tal) as total_paid,
  SUM(balance_due) as total_balance
FROM fee_tracking;

-- 10. Check student_documents schema for education_year column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_documents'
  AND column_name IN ('education_year', 'academic_year', 'is_checked', 'category');
