# Document Verification Count & Fee Tracking Integration

## Feature Overview

This feature adds a `doc_verification_count` column to track how many times an admin verifies documents for a student. Each verification automatically updates the student's record in the `fee_tracking` table with the latest data from `student_form_submissions`.

## What Was Implemented

### 1. **Database Changes** ✅
- Added `doc_verification_count` column to `eligible_students` table
- Default value: `0`
- Constraint: Must be >= 0
- Index added for performance

### 2. **Admin Dashboard - Document Verification** ✅
When admin clicks the green tick (✅) button under Actions:
1. Documents are marked as verified in `student_documents` table
2. `doc_verification_count` is incremented by +1 in `eligible_students`
3. Student data is fetched from `student_form_submissions`
4. `fee_tracking` record is created or updated with latest data
5. Fee tracking list is refreshed automatically

### 3. **Fee Tracking Behavior** ✅

**For NEW Students (First Verification):**
- Creates new record in `fee_tracking`
- All fields populated from `student_form_submissions`
- `fee_status` = 'Pending'
- `fee_paid_by_tal` = 0
- `voucher_url` = null

**For EXISTING Students (Subsequent Verifications):**
- Updates existing record with latest student data
- **PRESERVES** `voucher_url` (never overwrites uploaded vouchers)
- **PRESERVES** `fee_paid_by_tal` (payment information kept)
- **PRESERVES** `total_paid_by_tal` (payment history maintained)
- Recalculates `fee_status` based on preserved payment
- Updates `total_educational_expenses` with latest form data

### 4. **Data Flow**

```
Admin clicks ✅ Verify Button
    ↓
Documents marked as verified (student_documents.is_checked = true)
    ↓
doc_verification_count incremented (+1)
    ↓
Student data fetched from student_form_submissions
    ↓
Check if fee_tracking record exists
    ↓
┌─────────────────────┬──────────────────────┐
│   NEW Student       │  EXISTING Student    │
│   (First time)      │  (Re-verification)   │
├─────────────────────┼──────────────────────┤
│ INSERT new record   │ UPDATE existing      │
│ All fields from form│ Preserve:            │
│ fee_status=Pending  │ - voucher_url        │
│ fee_paid_by_tal=0   │ - fee_paid_by_tal    │
│ voucher_url=null    │ - total_paid_by_tal  │
│                     │ Recalculate status   │
└─────────────────────┴──────────────────────┘
    ↓
Fee Tracking list refreshed
    ↓
Admin sees updated student in Fee Tracking section
```

## Files Modified

### 1. `supabase/add-doc-verification-count.sql` (NEW)
**Purpose:** Add doc_verification_count column to eligible_students

**What it does:**
- Adds `doc_verification_count` column with default 0
- Adds check constraint (>= 0)
- Creates index for performance
- Updates existing records to 0

### 2. `src/AdminDashboard.jsx`
**Changes:**

#### Updated `handleVerifyStudentDocuments(student)`
```javascript
// Before: Just verified documents
// After: 
// 1. Verifies documents
// 2. Increments doc_verification_count
// 3. Calls populateOrUpdateFeeTracking()
// 4. Shows count in success message
```

#### Renamed & Updated Function
- **Old:** `autoPopulateFeeTracking()` - Only inserted new records
- **New:** `populateOrUpdateFeeTracking()` - Inserts OR updates with data preservation

**Key Features:**
- Calculates `total_educational_expenses` with 3-level priority
- Preserves `voucher_url` on updates (critical!)
- Preserves payment information on updates
- Recalculates fee status based on preserved payments
- Refreshes fee tracking list automatically

## Setup Instructions

### Step 1: Run SQL Migration (REQUIRED)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open: `supabase/add-doc-verification-count.sql`
3. Copy all SQL code
4. Paste into SQL editor
5. Click "Run"

**Expected Output:**
```
Column doc_verification_count added successfully!
```

### Step 2: Verify Column Was Added

Run this query to verify:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'eligible_students' 
  AND column_name = 'doc_verification_count';
```

**Expected Result:**
```
column_name          | data_type | column_default
---------------------|-----------|---------------
doc_verification_count | integer | 0
```

### Step 3: Test the Complete Flow

#### Test 1: First Verification (New Student)
1. Log in as admin
2. Go to "Document Verification"
3. Find a student with unverified documents
4. Click green ✅ button under Actions
5. **Expected:**
   - Alert shows: "Documents verified successfully! Verification count: 1. Student updated in Fee Tracking."
   - Go to "Fee Tracking" section
   - Student appears with all fields filled
   - fee_status = 'Pending'
   - fee_paid_by_tal = 0

#### Test 2: Second Verification (Existing Student)
1. In Fee Tracking, note the student's current data
2. If you want to test voucher preservation:
   - Upload a voucher for this student
   - Note the voucher_url
3. Go back to "Document Verification"
4. Click green ✅ button for the same student again
5. **Expected:**
   - Alert shows: "Documents verified successfully! Verification count: 2. Student updated in Fee Tracking."
   - doc_verification_count = 2 in database
   - Student record in fee_tracking is UPDATED with latest form data
   - **voucher_url is PRESERVED** (not lost)
   - **fee_paid_by_tal is PRESERVED** (payment info kept)

#### Test 3: Verify Data in Database
Run these queries:

**Check verification count:**
```sql
SELECT email, student_name, doc_verification_count
FROM eligible_students
WHERE doc_verification_count > 0
ORDER BY doc_verification_count DESC;
```

**Check fee_tracking updates:**
```sql
SELECT 
  ft.student_public_id,
  ft.student_name,
  ft.total_educational_expenses,
  ft.fee_paid_by_tal,
  ft.fee_status,
  ft.voucher_url,
  ft.updated_at
FROM fee_tracking ft
INNER JOIN eligible_students es ON ft.email = es.email
WHERE es.doc_verification_count > 0
ORDER BY ft.updated_at DESC;
```

## Database Schema

### eligible_students (Updated)
```sql
CREATE TABLE public.eligible_students (
  -- ... existing columns ...
  doc_verification_count integer DEFAULT 0,  -- NEW COLUMN
  CONSTRAINT doc_verification_count_check CHECK (doc_verification_count >= 0),
  -- ... other constraints ...
);
```

### fee_tracking (No Changes)
```sql
CREATE TABLE public.fee_tracking (
  id bigserial PRIMARY KEY,
  student_form_id integer,
  student_public_id text NOT NULL,
  student_name text NOT NULL,
  email text NOT NULL,
  whatsapp_number text,
  camp_name text,
  camp_date date,
  education text,
  school text,
  branch text,
  total_educational_expenses numeric(10, 2),
  fee_paid_by_tal numeric(10, 2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  voucher_url text,
  fee_status text DEFAULT 'Pending',
  balance_due numeric GENERATED ALWAYS AS (
    total_educational_expenses - COALESCE(fee_paid_by_tal, 0)
  ) STORED,
  total_paid_by_tal numeric(10, 2) DEFAULT 0
);
```

## Field Mapping: student_form_submissions → fee_tracking

```javascript
{
  student_form_id: formData.id,
  student_public_id: formData.student_public_id,
  student_name: formData.full_name || formData.first_name,
  email: formData.email,
  whatsapp_number: formData.whatsapp || formData.contact,
  camp_name: formData.camp_name,
  camp_date: formData.camp_date,
  education: formData.educationcategory || formData.class,
  school: formData.school,
  branch: formData.branch,
  total_educational_expenses: calculated_value,  // See priority below
  fee_paid_by_tal: preserved_or_0,
  total_paid_by_tal: preserved_or_0,
  fee_status: calculated_based_on_payment,
  voucher_url: preserved_or_null  // NEVER overwritten
}
```

## total_educational_expenses Calculation Priority

1. **Priority 1:** Use `formData.total_educational_expenses` directly (if available)
2. **Priority 2:** Sum from `formData.educational_expenses` JSON:
   - tuition_fee
   - books_study_materials
   - uniform
   - transport_fee
   - examination_fee
   - hostel_accommodation
   - food_mess_charges
3. **Priority 3:** Use `formData.fee` field as fallback

## Important Behaviors

### ✅ What Gets Updated Every Verification:
- `student_name` (if changed in form)
- `email` (if changed)
- `whatsapp_number` (if changed)
- `camp_name` (if changed)
- `camp_date` (if changed)
- `education` (if student moved to next year)
- `school` (if changed)
- `branch` (if changed)
- `total_educational_expenses` (recalculated)
- `updated_at` (timestamp)

### 🔒 What Gets PRESERVED (Never Overwritten):
- `voucher_url` - Uploaded payment vouchers are kept
- `fee_paid_by_tal` - Payment amount is kept
- `total_paid_by_tal` - Total payment is kept
- `id` - Record ID stays the same

### 🔄 What Gets Recalculated:
- `fee_status` - Based on preserved payment vs new expenses:
  - 'Pending' if fee_paid_by_tal = 0
  - 'Paid' if fee_paid_by_tal >= total_educational_expenses
  - 'Partial' if fee_paid_by_tal < total_educational_expenses

## Use Cases

### Use Case 1: Annual Re-verification
**Scenario:** Student moves from 1st Year to 2nd Year
1. Student updates form with new year and new fees
2. Student uploads new documents (2nd Year marksheets)
3. Admin verifies new documents
4. **Result:**
   - doc_verification_count increments (e.g., 1 → 2)
   - fee_tracking updated with 2nd Year data
   - education field changes to "2nd Year"
   - total_educational_expenses updated to new fees
   - Previous voucher and payment info preserved

### Use Case 2: Correcting Student Information
**Scenario:** Student's school name changed
1. Student updates form with new school name
2. Admin re-verifies documents (even if already verified)
3. **Result:**
   - doc_verification_count increments
   - fee_tracking.school updated with new name
   - Payment info and vouchers preserved

### Use Case 3: Fee Structure Change
**Scenario:** School increased fees for next year
1. Student updates form with new total_educational_expenses
2. Admin verifies documents
3. **Result:**
   - total_educational_expenses updated
   - balance_due recalculated automatically
   - fee_status may change from "Paid" to "Partial" (if fees increased)

## Troubleshooting

### Issue: doc_verification_count not incrementing
**Check:**
1. Verify SQL migration was run successfully
2. Check browser console for errors
3. Verify column exists:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'eligible_students' 
     AND column_name = 'doc_verification_count';
   ```

### Issue: fee_tracking not updating
**Check:**
1. Browser console for errors
2. Verify student_form_submissions has data:
   ```sql
   SELECT id, full_name, email, total_educational_expenses
   FROM student_form_submissions
   WHERE email = 'student@example.com';
   ```
3. Check if fee_tracking record exists:
   ```sql
   SELECT * FROM fee_tracking
   WHERE student_form_id = YOUR_STUDENT_ID;
   ```

### Issue: voucher_url being lost
**This should NOT happen with the new code.**
If it does:
1. Check that you're using the updated `populateOrUpdateFeeTracking()` function
2. Verify the UPDATE logic preserves voucher_url
3. Check browser console for the log: "Fee tracking record UPDATED successfully"

## Testing Checklist

- [ ] SQL migration run successfully
- [ ] doc_verification_count column exists with default 0
- [ ] First verification creates fee_tracking record
- [ ] Second verification updates fee_tracking record
- [ ] doc_verification_count increments correctly (0 → 1 → 2 → ...)
- [ ] voucher_url preserved on updates
- [ ] fee_paid_by_tal preserved on updates
- [ ] fee_status recalculated correctly
- [ ] total_educational_expenses calculated with correct priority
- [ ] Fee tracking list refreshes automatically
- [ ] Success message shows correct count

## Next Steps (Optional Enhancements)

1. **Display Count in UI:**
   - Show doc_verification_count in Document Verification table
   - Add column: "Verification Count"

2. **Verification History:**
   - Create audit log table to track each verification
   - Store: timestamp, admin_id, documents_verified, count_at_time

3. **Auto-Notifications:**
   - Notify student when verified
   - Send email with updated fee_tracking info

4. **Bulk Verification:**
   - Select multiple students
   - Verify all at once
   - Increment counts for all

## Support

For issues or questions:
1. Check browser console (F12) for errors
2. Verify SQL migration completed
3. Check Supabase logs
4. Test with single student first
5. Verify table schemas match expected structure
