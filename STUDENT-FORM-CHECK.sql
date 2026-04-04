/* 🔍 DIAGNOSE studentFormId issue */

-- 1. Does student_form_submissions exist for hi@gmail.com?
SELECT id, pg_typeof(id), email FROM student_form_submissions WHERE email = 'hi@gmail.com';

-- 2. Test insert (with required fields)
INSERT INTO student_form_submissions (
  first_name, last_name, full_name, email, address, contact,
  educationcategory, educationsubcategory, educationyear,
  school, class
) VALUES (
  'Test', 'Student', 'Test Student', 'hi@gmail.com', 'Test Address', '9876543210',
  'High School', '10th', '2024', 'Test School', '10'
) RETURNING id;

-- 3. Now test app upload → studentFormId found → DB insert succeeds

-- Run 1 → if empty → Run 2 → Refresh app → Upload success!
