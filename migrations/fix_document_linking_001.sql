-- Migration: Fix Document Verification by Supporting Both student_id and student_public_id Linking
-- Date: 2025-05-18
-- Purpose: Add indexes to optimize document queries by both student_id and student_public_id
--          to resolve the issue where documents are not appearing in Admin Dashboard verification

-- ENSURE student_documents table has the student_public_id column
-- If this column doesn't exist, run:
-- ALTER TABLE student_documents ADD COLUMN student_public_id TEXT;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- These indexes significantly speed up queries filtering by student_id or student_public_id

CREATE INDEX IF NOT EXISTS idx_student_documents_student_id 
  ON student_documents(student_id);

CREATE INDEX IF NOT EXISTS idx_student_documents_student_public_id 
  ON student_documents(student_public_id);

-- Composite index for filtering by category AND student_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id_category 
  ON student_documents(student_id, category);

-- Composite index for filtering by category AND student_public_id
CREATE INDEX IF NOT EXISTS idx_student_documents_student_public_id_category 
  ON student_documents(student_public_id, category);

-- Index for sorting by upload date (used in document listings)
CREATE INDEX IF NOT EXISTS idx_student_documents_uploaded_at 
  ON student_documents(uploaded_at DESC);

-- Composite index for frequent queries: category + both ID types + is_checked
CREATE INDEX IF NOT EXISTS idx_student_documents_verification_check 
  ON student_documents(category, is_checked);

-- ============================================================================
-- BACKFILL MISSING student_public_id VALUES
-- ============================================================================
-- For existing documents that only have student_id, try to populate student_public_id
-- from the student_form_submissions table if possible.
-- This helps maintain consistency for backward compatibility.

UPDATE student_documents sd
SET student_public_id = sfs.student_public_id
WHERE sd.student_public_id IS NULL
  AND sd.student_id = sfs.id
  AND sfs.student_public_id IS NOT NULL;

-- ============================================================================
-- VERIFY DATA CONSISTENCY
-- ============================================================================
-- Check for documents with no linking information (should be rare after above updates)
-- SELECT COUNT(*) as orphaned_documents 
-- FROM student_documents 
-- WHERE student_id IS NULL AND student_public_id IS NULL;

-- Check the distribution of how documents are linked
-- SELECT 
--   COUNT(*) as total_documents,
--   COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as linked_by_student_id,
--   COUNT(CASE WHEN student_public_id IS NOT NULL THEN 1 END) as linked_by_student_public_id,
--   COUNT(CASE WHEN student_id IS NOT NULL AND student_public_id IS NOT NULL THEN 1 END) as linked_by_both
-- FROM student_documents;
