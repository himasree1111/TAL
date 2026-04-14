-- Update existing fee_tracking records with missing fields from student_form_submissions
-- Run AFTER populate_fee_tracking_fixed.sql

UPDATE fee_tracking ft
SET 
  whatsapp_number = s.whatsapp,
  camp_name = s.camp_name,
  camp_date = s.camp_date,
  total_educational_expenses = COALESCE(s.total_educational_expenses, 0)
FROM student_form_submissions s
WHERE ft.student_form_id = s.id
  AND (ft.whatsapp_number IS NULL 
       OR ft.camp_name IS NULL 
       OR ft.camp_date IS NULL 
       OR ft.total_educational_expenses IS NULL);

-- Verify update
SELECT 'Updated records: ' || COUNT(*) as updated_count 
FROM fee_tracking 
WHERE whatsapp_number IS NOT NULL 
  AND camp_name IS NOT NULL 
  AND camp_date IS NOT NULL 
  AND total_educational_expenses IS NOT NULL;

-- Sample check
SELECT student_name, whatsapp_number, camp_name, camp_date, total_educational_expenses 
FROM fee_tracking 
LIMIT 5;

