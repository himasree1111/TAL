-- FIXED: Add ONLY is_single_parent (special_remarks already exists)
-- Schema shows special_remarks present, is_single_parent missing

BEGIN;

-- Add is_single_parent column ONLY
ALTER TABLE admin_student_info 
ADD COLUMN IF NOT EXISTS is_single_parent BOOLEAN DEFAULT FALSE;

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_student_info' 
  AND column_name = 'is_single_parent';

COMMIT;

