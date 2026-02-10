# TAL Portal — TODO

Gaps identified by comparing codebase against project brief (GNITS TAL.pdf) and presentation (Touch A Life Presentation.pdf).

---

## Completed

- [x] Fix Admin logout functionality (was not signing out properly)
- [x] Remove Supabase, replace with local Express+SQLite backend

---

## Foundation (build these first)

### 1. Build fee tracking system
- [ ] Create `fee_payments` table: id, student_id, amount, payment_date, payment_method, paid_by (TAL/student/donor), receipt_url, notes, created_at
- [ ] CRUD endpoints: POST/GET/PUT/DELETE `/api/fee-payments`
- [ ] Replace single `fee_structure` text field with real installment tracking
- [ ] Display payment history with dates and amounts in admin + student dashboards

### 2. Build donor-student mapping system
- [ ] Create `donor_mapping` table: id, student_id, donor_name, year_of_support, amount, is_current_sponsor, notes, created_at
- [ ] CRUD endpoints for donor mappings
- [ ] Wire up Donor Mapping section in AdminDashboard.jsx (currently commented out)
- [ ] Admin can tag each girl to a donor (past and present), view donor name/years/amount
- [ ] Admin can export donor-wise reports

### 3. Build notification/broadcast system
- [ ] Create `notifications` table: id, recipient_email, recipient_role, title, message, type, priority, is_read, created_by, created_at
- [ ] Endpoints: POST `/api/notifications`, GET `/api/notifications?recipient_email=X`, PUT `/api/notifications/:id/read`, POST `/api/notifications/broadcast`
- [ ] Uncomment and wire up Alerts & Broadcast section in AdminDashboard.jsx
- [ ] Replace hardcoded alerts in studentdashboard.js with real notifications

### 4. Build donation management system
- [ ] Create `donations` table: id, donor_id, student_id, amount, payment_date, payment_method, receipt_number, notes, created_at
- [ ] Online donation recording flow
- [ ] Printable donation receipts (PDF)
- [ ] Wire donor dashboard to real donation data

### 5. Add missing student form fields
- [ ] Father's Name (dedicated field)
- [ ] Mother's Name (dedicated field)
- [ ] Guardian's Name
- [ ] Head of Family
- [ ] Income Source
- [ ] Monthly Income
- [ ] No. of dependents
- [ ] School/College Address (separate from home address)
- [ ] Add corresponding columns to `student_form_submissions` table
- [ ] Update admin view modal to display new fields

---

## New Stakeholder Roles

### 6. Add Trustee role with full dashboard
- [ ] Trustee login page
- [ ] Trustee dashboard with:
  - [ ] Create Volunteer profiles
  - [ ] Assign Volunteer to Student
  - [ ] Set Volunteer targets (Monthly/Quarterly/Yearly)
  - [ ] Reassign/change Volunteer
  - [ ] Track each Volunteer's targets and progress
  - [ ] Volunteer Visibility Settings (restrict what Volunteers can see)
  - [ ] Donor Visibility Settings (restrict what Donors can see)
  - [ ] Alert Settings for Volunteers (due dates, reminder frequency)
  - [ ] Fee Paid vs Pending Report (all students — paid vs due, totals)
- [ ] New DB tables: `volunteer_assignments`, `volunteer_targets`, `visibility_settings`

### 7. Add Auditor/Accountant role
> Blocked by: #1 (fee tracking), #4 (donations)
- [ ] Auditor login page
- [ ] Auditor dashboard (read-only) with:
  - [ ] Donations Collected Report (grouped by donor/date/amount)
  - [ ] Expenditure Report (grouped by student/category/date)
- [ ] Both reports filterable by date range and exportable to CSV/PDF

---

## Student Features

### 8. Connect student dashboard to real backend data
> Blocked by: #1 (fee tracking)
- [ ] On mount, fetch logged-in student's submission from `/api/student-forms`
- [ ] Display real profile info (name, DOB, contact, school, class)
- [ ] Display real academic data (percentages, education category)
- [ ] Display real fee status (from fee_payments table)
- [ ] Display real uploaded documents (from document URLs)
- [ ] Add loading and error states
- [ ] Remove all hardcoded dummy data

### 9. Enable students to self-apply for scholarship
- [ ] Students can fill out the scholarship application form themselves (not just volunteers)
- [ ] Detect user role and adjust form (volunteer details optional for student submissions)
- [ ] Student-submitted applications appear in admin dashboard for evaluation

### 10. Add "Know Your Volunteer" and "Know Your Donor" for students
> Blocked by: #2 (donor mapping), #6 (trustee/assignments)
- [ ] "Your Volunteer" card on student dashboard showing assigned volunteer details
- [ ] "Your Donor" card (shown only if trustee has enabled donor visibility)
- [ ] Contact info for reaching volunteer

### 11. Add student-triggered fee alerts
> Blocked by: #3 (notifications), #6 (trustee role)
- [ ] "Send Fee Alert" button on student dashboard
- [ ] Creates notification for assigned volunteer AND all trustees
- [ ] Includes student name, fee amount due, due date

---

## Volunteer Features

### 12. Expand Volunteer dashboard
- [ ] Maintain Fee Structure per student (total fee, number of terms, fee per each term)
- [ ] Configure Fee Alerts (set due dates and notice period/frequency for reminders)
- [ ] Track Your Target (progress vs need for assigned students)
- [ ] Create a Donor profile in the system
- [ ] Enter Donation Details
- [ ] Print Donation Receipts (PDF)
- [ ] Upload Fee Receipts (separately, not just during form submission)
- [ ] Adopt a Child — assign a dedicated donor to a specific student
- [ ] New DB tables: `fee_structures` (student_id, total_fee, num_terms, term_fees JSON)

---

## Admin Features

### 13. Add admin CRUD for student profiles
- [ ] "Add Student" button — form modal to create a student profile directly
- [ ] "Edit" button per student row — editable modal with all fields
- [ ] "Delete" button per student row with confirmation dialog
- [ ] Admin can upload documents/receipts/certificates on behalf of a student

### 14. Add document upload for admin and student dashboards
> Blocked by: #3 (notifications)
- [ ] Student dashboard: wire upload button to POST `/api/upload`, save URL to record
- [ ] Student dashboard: fetch and display all uploaded doc URLs, working download/delete
- [ ] Admin dashboard: document upload per student in view modal
- [ ] Notifications when either party uploads (student notifies admin, admin notifies student)

---

## Donor Features

### 15. Rebuild Donor dashboard with real data
> Blocked by: #2 (donor mapping), #4 (donations)
- [ ] Remove all hardcoded data
- [ ] Adopt a Child feature
- [ ] View Adopted Child Progress (academic %, fee status)
- [ ] Pay Donation (record donation)
- [ ] See Donation Requirements (what each adopted child needs)
> Note: Presentation gives donors platform access (contradicts first PDF which said no direct access). Following presentation spec.

---

## Reports & Export

### 16. Build financial reports
> Blocked by: #1 (fee tracking), #4 (donations)
- [ ] Monthly/Quarterly/Yearly Financial Need Report (Fee, Books, Tools, Hostel, Others)
- [ ] Student-wise and study-category-wise breakdown
- [ ] Month-wise Collections vs Requirements Report
- [ ] Fee Paid vs Pending Report
- [ ] All filterable by date range and exportable

### 17. Add PDF export alongside CSV export
- [ ] Add PDF generation library (jspdf + jspdf-autotable or pdfkit)
- [ ] "Export PDF" button in: Manage Beneficiaries, Eligible/Non-Eligible reports, Donor reports, Fee reports
- [ ] PDF includes TAL branding/header, data table, generation date

---

## Other

### 18. Add camp participation tracking
- [ ] Create `camps` table: id, name, date, location, description
- [ ] Create `camp_participation` table: id, student_id, camp_id, status (attended/selected/registered)
- [ ] Camp CRUD endpoints
- [ ] Student form: dropdown of existing camps instead of free text
- [ ] Student dashboard: show camp history
- [ ] Support multiple camp participation per student

### 19. Add subject-wise academic records tracking
- [ ] Create `academic_records` table: id, student_id, academic_year, semester, subject_name, marks_obtained, max_marks, grade, certificate_url
- [ ] CRUD endpoints
- [ ] Admin/student can add per-subject marks for each semester/year
- [ ] Display in student dashboard and admin view modal
