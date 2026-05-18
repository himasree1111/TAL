-- SQL Migration: Student Documents - Support Both student_id and student_public_id
-- Purpose: Backfill missing student_public_id values and create performance indexes
-- This enables document queries by either identifier, fixing the document visibility issue
--
-- BEFORE: Documents only visible if linked by student_id
-- AFTER: Documents visible if linked by EITHER student_id OR student_public_id

-- ============================================================================
-- STEP 1: Backfill Missing student_public_id Values
-- ============================================================================
-- For existing documents that only have student_id, populate student_public_id
-- from the student_form_submissions table.
-- This ensures backward compatibility for old documents.

UPDATE student_documents sd
SET student_public_id = sfs.student_public_id
WHERE sd.student_public_id IS NULL
  AND sd.student_id = sfs.id
  AND sfs.student_public_id IS NOT NULL;

-- Log the results
-- SELECT COUNT(*) as documents_updated
-- FROM student_documents
-- WHERE student_id IS NOT NULL AND student_public_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Create Performance Indexes
-- ============================================================================
-- These indexes dramatically speed up queries filtering by either identifier

-- Index for querying by student_id (most common)
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id
  ON student_documents(student_id)
  WHERE student_id IS NOT NULL;

-- Index for querying by student_public_id (fallback method)
CREATE INDEX IF NOT EXISTS idx_student_documents_student_public_id
  ON student_documents(student_public_id)
  WHERE student_public_id IS NOT NULL;

-- Composite index for common filter: category + student_id
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id_category
  ON student_documents(student_id, category)
  WHERE student_id IS NOT NULL;

-- Composite index for common filter: category + student_public_id
CREATE INDEX IF NOT EXISTS idx_student_documents_student_public_id_category
  ON student_documents(student_public_id, category)
  WHERE student_public_id IS NOT NULL;

-- Index for verification checks (is_checked + student_id)
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id_is_checked
  ON student_documents(student_id, is_checked)
  WHERE student_id IS NOT NULL;

-- Index for verification checks (is_checked + student_public_id)
CREATE INDEX IF NOT EXISTS idx_student_documents_student_public_id_is_checked
  ON student_documents(student_public_id, is_checked)
  WHERE student_public_id IS NOT NULL;

-- Index for sorting by upload date
CREATE INDEX IF NOT EXISTS idx_student_documents_uploaded_at
  ON student_documents(uploaded_at DESC);

-- ============================================================================
-- STEP 3: Data Consistency Checks
-- ============================================================================
-- Run these queries to verify the fix worked correctly

-- Check linking statistics
-- SELECT 
--   COUNT(*) as total_documents,
--   COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as linked_by_student_id,
--   COUNT(CASE WHEN student_public_id IS NOT NULL THEN 1 END) as linked_by_student_public_id,
--   COUNT(CASE WHEN student_id IS NOT NULL AND student_public_id IS NOT NULL THEN 1 END) as linked_by_both,
--   COUNT(CASE WHEN student_id IS NULL AND student_public_id IS NULL THEN 1 END) as orphaned
-- FROM student_documents;

-- Check for orphaned documents (should be 0 after migration)
-- SELECT id, category, uploaded_at
-- FROM student_documents
-- WHERE student_id IS NULL AND student_public_id IS NULL
-- LIMIT 10;

-- ============================================================================
-- STEP 4: Performance Verification (Optional)
-- ============================================================================
-- After backfill and index creation, verify query performance improved
-- 
-- Before: SELECT * FROM student_documents WHERE student_id = 123;  (slow, no index)
-- After:  SELECT * FROM student_documents WHERE student_id = 123;  (fast, indexed)
--
-- Use EXPLAIN to verify indexes are being used:
-- EXPLAIN SELECT * FROM student_documents WHERE student_id = 123;
-- EXPLAIN SELECT * FROM student_documents WHERE student_public_id = 'ABC-456';
