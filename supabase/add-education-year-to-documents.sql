-- Add education_year field to student_documents table
-- This allows tracking which academic year each document belongs to
-- Run this in Supabase SQL Editor

-- Add education_year column if it doesn't exist
ALTER TABLE student_documents 
ADD COLUMN IF NOT EXISTS education_year TEXT;

-- Add academic_year column for better tracking (e.g., "2024-2025")
ALTER TABLE student_documents 
ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_documents_education_year 
ON student_documents(education_year);

CREATE INDEX IF NOT EXISTS idx_student_documents_academic_year 
ON student_documents(academic_year);

-- Update existing documents to extract year from document_name if possible
-- This is a best-effort migration for existing data
UPDATE student_documents 
SET education_year = SUBSTRING(document_name FROM '(\d+(?:st|nd|rd|th)\s*Year)')
WHERE education_year IS NULL 
  AND document_name ~ '\d+(?:st|nd|rd|th)\s*Year';

-- For documents without year in name, set to 'Unknown'
UPDATE student_documents 
SET education_year = 'Unknown'
WHERE education_year IS NULL;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_documents' 
  AND column_name IN ('education_year', 'academic_year');

SELECT 'Migration completed successfully!' as status;
