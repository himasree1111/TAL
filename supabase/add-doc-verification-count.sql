-- Add doc_verification_count column to eligible_students table
-- This tracks how many times admin has verified documents for a student
-- Each verification triggers fee_tracking update

-- Add the column with default value 0
ALTER TABLE eligible_students 
ADD COLUMN IF NOT EXISTS doc_verification_count integer DEFAULT 0;

-- Add a check constraint to ensure it's not negative
ALTER TABLE eligible_students 
ADD CONSTRAINT doc_verification_count_check 
CHECK (doc_verification_count >= 0);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_eligible_students_doc_verification_count 
ON eligible_students(doc_verification_count);

-- Update existing records to 0
UPDATE eligible_students 
SET doc_verification_count = 0 
WHERE doc_verification_count IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'eligible_students' 
  AND column_name = 'doc_verification_count';

SELECT 'Column doc_verification_count added successfully!' as status;
