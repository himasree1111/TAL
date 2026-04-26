# TODO: Remove Education Columns from eligible_students and non_eligible_students

## Task
Remove the following columns from `eligible_students` and `non_eligible_students` tables:
- `education` VARCHAR(200)
- `educationcategory` VARCHAR(200)
- `educationsubcategory` VARCHAR(200)
- `year` VARCHAR(50)
- `college` TEXT
- `branch` VARCHAR(200)

Also remove `student_name` (redundant with `full_name`).

Keep these columns in `admin_student_info` as the source-of-truth.

## Status: ✅ COMPLETE

## Files Modified

### 1. `supabase/fix-approve-disapprove-trigger.sql` ✅
- Removed `student_name` from INSERT/VALUES/ON CONFLICT for both `eligible_students` and `non_eligible_students`
- Removed 6 education columns from trigger function

### 2. `supabase/fix-status-update-rpc.sql` ✅
- Removed `student_name` from INSERT/VALUES/ON CONFLICT in `approve_student_by_id` and `disapprove_student_by_id`
- Removed 6 education columns from both RPC functions

### 3. `supabase/fix-approve-disapprove-backend.sql` ✅
- Removed `student_name` from CREATE TABLE definitions for both tables
- Removed `student_name` from INSERT/VALUES/ON CONFLICT in trigger
- Removed `student_name` from `sync_approved_students()` SELECT/INSERT
- Removed 6 education columns from all functions

### 4. `supabase/migrate-existing-data-safe.sql` ✅
- Removed `student_name` from ALTER TABLE ADD COLUMN blocks for both tables
- Removed 6 education columns from ALTER TABLE ADD COLUMN blocks
- Removed `student_name` from INSERT/VALUES/ON CONFLICT in trigger
- Removed `student_name` from `sync_approved_students()` SELECT/INSERT

## Summary of Changes
- **Columns removed** from `eligible_students` and `non_eligible_students`:
  - `student_name` (redundant with `full_name`)
  - `education`
  - `educationcategory`
  - `educationsubcategory`
  - `year`
  - `college`
  - `branch`

- **Kept in `admin_student_info`** as source-of-truth for all education data

- **Impact**: Triggers and RPC functions now only sync non-education fields to derived tables. Education data remains in `admin_student_info` only.
