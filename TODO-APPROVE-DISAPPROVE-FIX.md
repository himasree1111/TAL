# TODO: Fix Approve/Disapprove Status Update

## Steps
- [x] Fix student data transformation (id/student_id mapping) in main fetch and fetchStudents
- [x] Fix handleApprove to use correct DB identifier, verify row affected, refresh lists
- [x] Fix handleNotApprove similarly
- [x] Fix handleMoveToEligible to refresh both non-eligible and eligible lists
- [x] Create SQL trigger fix file
- [ ] Test the flow

## Summary of Changes

### Frontend (src/AdminDashboard.jsx)

1. **Fixed `transformedStudents` mapping** (line ~215):
   - Changed `id: student.id || index + 1` → `id: (student.id || student.student_id) || index + 1`
   - Changed `student_id: student.id` → `student_id: student.id || student.student_id`
   - This ensures `student_id` correctly stores the `admin_student_info.id` (primary key) for database operations.

2. **Fixed `fetchStudents()` function** (line ~2900):
   - Same id/student_id mapping fix applied.
   - Added `student_public_id` and other fields to the transformed data.

3. **Fixed `handleApprove()` function**:
   - Added `dbRecordId = student.student_id || student.id` to get the correct database record ID.
   - Added validation: if no `dbRecordId`, show error and return.
   - Added `.select()` to the Supabase update query to verify rows were actually updated.
   - Added check: if `updatedRows.length === 0`, warn user and refresh list.
   - Added `await fetchStudents()` after successful update to ensure UI consistency.
   - Added `fetchEligibleStudents()` and `fetchEligibleCount()` to refresh eligible lists.

4. **Fixed `handleNotApprove()` function**:
   - Same fixes as `handleApprove()` — correct DB identifier, `.select()`, row count verification, `fetchStudents()` refresh.

5. **Fixed `handleMoveToEligible()` function**:
   - Added `dbRecordId = student.id || student.student_id` for correct identifier.
   - Added validation for missing identifier.
   - Added `await fetchNonEligibleStudents()` and `fetchEligibleStudents()` + `fetchEligibleCount()` to refresh both lists after move.

### Backend (supabase/fix-approve-disapprove-trigger.sql)

Created a comprehensive SQL fix file that:
1. Ensures `admin_student_info.status` column exists with default 'Pending'.
2. Creates/replaces the trigger function `trg_move_student_on_status_change()`.
3. Creates the trigger `trg_admin_student_info_status_change` on `admin_student_info`.
4. Ensures `move_to_eligible_from_non_eligible()` RPC function exists.
5. Grants execute permissions.

## How to Apply

1. **Run the SQL file** in Supabase Dashboard → SQL Editor:
   ```
   supabase/fix-approve-disapprove-trigger.sql
   ```

2. **Restart the frontend** (if running locally) or redeploy.

3. **Test the flow**:
   - Go to Manage Beneficiaries
   - Approve a student → should disappear from pending, appear in Eligible
   - Disapprove a student → should disappear from pending, appear in Non-Eligible
   - Move from Non-Eligible to Eligible → should update correctly
