# TAL Portal — TODO

Gaps identified by comparing codebase against project brief (GNITS TAL.pdf) and presentation (Touch A Life Presentation.pdf).

---

## Completed

- [x] Fix Admin logout functionality (was not signing out properly)
- [x] Remove Supabase, replace with local Express+SQLite backend
- [x] Build fee_payments table + CRUD endpoints + summary endpoint
- [x] Build donor_mapping table + CRUD endpoints
- [x] Build notifications table + CRUD + broadcast endpoints
- [x] Build donations table + CRUD + summary endpoints
- [x] Add missing DB columns (father_name, mother_name, etc.) via ALTER TABLE
- [x] Wire up Donor Mapping section in AdminDashboard (was commented out)
- [x] Wire up Fee Tracking section in AdminDashboard (was commented out)
- [x] Wire up Alerts & Broadcast section in AdminDashboard (was commented out)
- [x] Connect StudentDashboard to real backend data (fee status, notifications, documents)
- [x] Connect DonorDashboard to real backend data (donations, mappings, notifications)
- [x] Add notifications + fee summary to VolunteerDashboard
- [x] Update QueryBuilder (api.js) to pass eq filters as direct query params
- [x] Update Financial Overview & Donor Contributions in admin Reports with real data
- [x] Add missing student form UI fields (father, mother, guardian, income, etc.)
- [x] Add "Know Your Volunteer" and "Know Your Donor" cards to student dashboard
- [x] Add student-triggered fee alert button
- [x] Enable student self-apply for scholarship (role-aware form)
- [x] Add Admin CRUD for student profiles (Add/Edit/Delete with backend)
- [x] Expand Volunteer dashboard (donations, fee payments, donor mapping, fee receipt upload)
- [x] Add Donor "Pay Donation" form and "Child Progress" view
- [x] Add Fee Paid vs Pending, Collections vs Requirements, Student-wise reports with CSV export
- [x] Add fee_structures table + CRUD endpoints + Volunteer Dashboard UI for term-wise tracking
- [x] Wire all student form family/income fields to submit payload + admin edit/view modals
- [x] Add documents table + CRUD + upload/list/delete in Student & Admin dashboards
- [x] Add date range filtering to fee-payments/summary and donations/summary endpoints
- [x] Add study_category to fee summary for category-wise breakdown
- [x] Add date range filter UI in Admin Reports section
- [x] Fix test isolation (maxWorkers=1 in jest.config.js)
- [x] Fix DonorDashboard sidebar overlapping main content + add responsive design
- [x] Fix StudentDashboard sidebar overlap + add responsive breakpoints (768px)
- [x] Fix AdminDashboard responsive width reset at 900px breakpoint
- [x] Add auto-notifications on document upload (student→admin, admin→student)
- [x] Add Adopt a Child feature for donors (available students endpoint + UI)
- [x] Add PDF export alongside CSV (jspdf + jspdf-autotable) for all admin reports
- [x] Add camps + camp_participation tables + full CRUD endpoints
- [x] Add academic_records table + full CRUD endpoints
- [x] Add api.js mappings for camps, camp_participation, academic_records
- [x] Write tests for camps, academic records, adoption, upload notifications (95 tests total)

---

## Foundation (build these first)

### 1. Build fee tracking system ✅
- [x] Create `fee_payments` table
- [x] CRUD endpoints: POST/GET/PUT/DELETE `/api/fee-payments` + summary
- [x] Display payment history with dates and amounts in admin + student dashboards
- [x] Replace single `fee_structure` text field with real installment tracking (term-wise)

### 2. Build donor-student mapping system ✅
- [x] Create `donor_mapping` table
- [x] CRUD endpoints for donor mappings
- [x] Wire up Donor Mapping section in AdminDashboard.jsx
- [x] Admin can tag each girl to a donor (past and present), view donor name/years/amount
- [x] Admin can export donor-wise reports

### 3. Build notification/broadcast system ✅
- [x] Create `notifications` table
- [x] Endpoints: POST, GET, PUT read, broadcast
- [x] Wire up Alerts & Broadcast section in AdminDashboard.jsx
- [x] Replace hardcoded alerts in studentdashboard.js with real notifications

### 4. Build donation management system (partial)
- [x] Create `donations` table + CRUD + summary endpoints
- [x] Wire donor dashboard to real donation data
- [ ] Online donation recording flow (from donor dashboard)
- [ ] Printable donation receipts (PDF)

### 5. Add missing student form fields ✅
- [x] Add corresponding columns to `student_form_submissions` table
- [x] Father's Name (form UI field + payload)
- [x] Mother's Name (form UI field + payload)
- [x] Guardian's Name (form UI field + payload)
- [x] Head of Family (form UI field + payload)
- [x] Income Source (form UI field + payload)
- [x] Monthly Income (form UI field + payload)
- [x] No. of dependents (form UI field + payload)
- [x] School/College Address (form UI field + payload)
- [x] Update admin view modal to display new fields
- [x] Update admin add/edit modal with all new fields

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

### 8. Connect student dashboard to real backend data ✅
- [x] On mount, fetch logged-in student's submission from `/api/student-forms`
- [x] Display real profile info (name, DOB, contact, school, class)
- [x] Display real academic data (percentages, education category)
- [x] Display real fee status (from fee_payments table)
- [x] Display real uploaded documents (from document URLs)
- [x] Add loading and error states
- [x] Remove all hardcoded dummy data

### 9. Enable students to self-apply for scholarship ✅
- [x] Students can fill out the scholarship application form themselves (not just volunteers)
- [x] Detect user role and adjust form (volunteer details optional for student submissions)
- [x] Student-submitted applications appear in admin dashboard for evaluation (uses same table)

### 10. Add "Know Your Volunteer" and "Know Your Donor" for students ✅
> Blocked by: #2 (donor mapping), #6 (trustee/assignments)
- [x] "Your Volunteer" card on student dashboard showing assigned volunteer details
- [x] "Your Donor" card (shown if current sponsor exists in donor_mapping)
- [x] Contact info for reaching volunteer

### 11. Add student-triggered fee alerts ✅
> Blocked by: #3 (notifications), #6 (trustee role)
- [x] "Send Fee Alert" button on student dashboard
- [x] Creates notification for assigned volunteer with student name, fee amount due
- [ ] Also notify all trustees (requires trustee role implementation)

---

## Volunteer Features

### 12. Expand Volunteer dashboard (partial) ✅
- [x] Fee Status tracking per student (total, paid, balance, status)
- [x] Maintain Fee Structure per student (total fee, number of terms, fee per each term)
- [ ] Configure Fee Alerts (set due dates and notice period/frequency for reminders)
- [ ] Track Your Target (progress vs need for assigned students)
- [x] Create a Donor profile in the system (via donor mapping)
- [x] Enter Donation Details
- [ ] Print Donation Receipts (PDF)
- [x] Upload Fee Receipts (separately, not just during form submission)
- [x] Adopt a Child — assign a dedicated donor to a specific student
- [x] New DB tables: `fee_structures` (student_id, total_fee, num_terms, term_fees JSON) + CRUD endpoints

---

## Admin Features

### 13. Add admin CRUD for student profiles ✅
- [x] "Add Student" button — form modal to create a student profile directly
- [x] "Edit" button per student row — editable modal with all fields
- [x] "Delete" button per student row with confirmation dialog (real backend call)
- [x] Admin can upload documents/receipts/certificates on behalf of a student

### 14. Add document upload for admin and student dashboards ✅
> Blocked by: #3 (notifications)
- [x] Create `documents` table + CRUD endpoints (POST/GET/DELETE `/api/documents`)
- [x] Student dashboard: wire upload button to POST `/api/documents`, save metadata to DB
- [x] Student dashboard: fetch and display all uploaded doc URLs, working download/delete
- [x] Admin dashboard: document upload per student in view modal with list/download/delete
- [x] Notifications when either party uploads (student notifies admin, admin notifies student)

---

## Donor Features

### 15. Rebuild Donor dashboard with real data ✅
- [x] Remove all hardcoded data
- [x] View sponsored students and donation overview from real API
- [x] View Adopted Child Progress (fee status per sponsored student)
- [x] Pay Donation (record donation from donor side with form)
- [x] See Donation Requirements (fee balance per adopted child)
- [x] Adopt a Child feature (donor selects from available students — requires student list endpoint for donors)
> Note: Presentation gives donors platform access (contradicts first PDF which said no direct access). Following presentation spec.

---

## Reports & Export

### 16. Build financial reports (partial) ✅
> Blocked by: #1 (fee tracking), #4 (donations)
- [x] Fee Paid vs Pending Report (with CSV export)
- [x] Collections vs Requirements Report (with CSV export)
- [x] Student-wise breakdown (with CSV export)
- [ ] Monthly/Quarterly/Yearly Financial Need Report (Fee, Books, Tools, Hostel, Others)
- [x] Date range filtering on reports (fee-payments/summary + donations/summary accept start_date/end_date)
- [x] Study-category-wise breakdown (study_category field added to fee-payments/summary)

### 17. Add PDF export alongside CSV export ✅
- [x] Add PDF generation library (jspdf + jspdf-autotable or pdfkit)
- [x] "Export PDF" button in: Manage Beneficiaries, Eligible/Non-Eligible reports, Donor reports, Fee reports
- [x] PDF includes TAL branding/header, data table, generation date

---

## Other

### 18. Add camp participation tracking (partial)
- [x] Create `camps` table: id, name, date, location, description
- [x] Create `camp_participation` table: id, student_id, camp_id, status (attended/selected/registered)
- [x] Camp CRUD endpoints
- [ ] Student form: dropdown of existing camps instead of free text
- [ ] Student dashboard: show camp history
- [x] Support multiple camp participation per student

### 19. Add subject-wise academic records tracking (partial)
- [x] Create `academic_records` table: id, student_id, academic_year, semester, subject_name, marks_obtained, max_marks, grade, certificate_url
- [x] CRUD endpoints
- [ ] Admin/student can add per-subject marks for each semester/year (UI)
- [ ] Display in student dashboard and admin view modal (UI)
