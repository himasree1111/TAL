-- BACKFILL is_single_parent ONLY
-- Matches by email OR student_id

-- Before count
SELECT 'BEFORE' as step, 
       COUNT(*) as total,
       COUNT(is_single_parent) FILTER (WHERE is_single_parent = TRUE) as single_parents
FROM admin_student_info;

-- UPDATE 
UPDATE admin_student_info asi
SET is_single_parent = COALESCE(sfs.is_single_parent, FALSE)
FROM student_form_submissions sfs 
WHERE (asi.email = sfs.email OR asi.student_id::text = sfs.id::text)
  AND asi.is_single_parent IS DISTINCT FROM sfs.is_single_parent;

-- After count  
SELECT 'AFTER' as step,
       COUNT(*) as total,
       COUNT(is_single_parent) FILTER (WHERE is_single_parent = TRUE) as single_parents  
FROM admin_student_info;

