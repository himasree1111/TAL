-- Supabase RLS Policies for Student Documents
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Enable RLS on student_documents table (if not already)
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- 1.a Add verification status column for student documents
ALTER TABLE student_documents
  ADD COLUMN IF NOT EXISTS is_checked boolean DEFAULT false;

-- 2. Storage Policies for 'student_documents' bucket
-- Make bucket public for read
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student_documents', 'student_documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload to their own email folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student_documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text ~ (auth.email()::text)
);

-- Policy: Authenticated users can read from own folder + public read
CREATE POLICY "Public can read all files" ON storage.objects FOR SELECT 
USING (bucket_id = 'student_documents');

-- 3. Table Policies for student_documents table
-- Users can view documents where student_id matches their student_form_submissions
CREATE POLICY "Users can view own documents" ON student_documents
FOR SELECT USING (
  auth.role() = 'authenticated'
  AND student_id IN (
    SELECT id FROM student_form_submissions 
    WHERE email = auth.email()
  )
);

-- Users can insert documents for their own student_id
CREATE POLICY "Users can insert own documents" ON student_documents
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND student_id IN (
    SELECT id FROM student_form_submissions 
    WHERE email = auth.email()
  )
);

-- Users can delete own documents
CREATE POLICY "Users can delete own documents" ON student_documents
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND id::text = ANY(
    SELECT ARRAY_AGG(id::text) FROM student_documents 
    WHERE student_id IN (
      SELECT id FROM student_form_submissions 
      WHERE email = auth.email()
    )
  )
);

-- Admins can update document verification status
CREATE POLICY "Admins can update verification status" ON student_documents
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND auth.jwt() -> 'user_metadata' ->> 'user_type' = 'admin'
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.jwt() -> 'user_metadata' ->> 'user_type' = 'admin'
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'student_documents';
SELECT * FROM storage.policies WHERE bucket_id = 'student_documents';

-- Test query (run as logged-in student)
-- SELECT * FROM student_documents LIMIT 1;

