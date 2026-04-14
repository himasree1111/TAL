-- FIXED: Include missing fields whatsapp_number, camp_name, camp_date, total_educational_expenses
-- Run this after feedback

INSERT INTO fee_tracking (
  student_form_id,
  student_public_id, email, student_name, education, school, branch,
  whatsapp_number, camp_name, camp_date, total_educational_expenses,
  fee_paid_by_tal, created_at, updated_at
)
SELECT 
  s.id as student_form_id,
  s.student_public_id,
  s.email,
  s.full_name,
  COALESCE(s.educationcategory, s.class, '') as education,
  s.school,
  s.branch,
  s.whatsapp as whatsapp_number,
  s.camp_name,
  s.camp_date,
  COALESCE(s.total_educational_expenses, 0) as total_educational_expenses,
  0, NOW(), NOW()
FROM student_form_submissions s
WHERE s.id NOT IN (SELECT student_form_id FROM fee_tracking WHERE student_form_id IS NOT NULL)
AND s.id IN (
  SELECT student_id
  FROM student_documents 
  WHERE category IN ('academic','personal','extracurricular')
    AND category != 'fee_receipt'
  GROUP BY student_id 
  HAVING bool_and(is_checked) = true 
     AND count(*) >= 1
)
LIMIT 50;

-- Verify
SELECT 'Populated: ' || COUNT(*) FROM fee_tracking;
SELECT whatsapp_number, camp_name, camp_date, total_educational_expenses FROM fee_tracking LIMIT 5;

