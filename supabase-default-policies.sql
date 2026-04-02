-- Supabase Policies for DEFAULT role (public/anon)
-- Run ALL in Supabase SQL Editor

-- 1. Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'student_documents';

-- 2. Table - authenticated + default roles
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- DEFAULT role can read
CREATE POLICY "Default can read student_documents" ON student_documents
FOR SELECT USING (true);

-- DEFAULT role can insert
CREATE POLICY "Default can insert student_documents" ON student_documents
FOR INSERT WITH CHECK (true);

-- DEFAULT role can delete (careful!)
CREATE POLICY "Default can delete student_documents"
