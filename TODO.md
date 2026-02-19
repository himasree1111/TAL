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
- [x] Members in Family (form UI field + payload)
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

---

## Evaluation Score Improvements (target: 9/10)

### Security (3→9)
- [x] Add authenticateToken middleware to ALL data endpoints
- [x] Restrict CORS to FRONTEND_URL origin (not wildcard)
- [x] Add file type validation (MIME whitelist: jpeg, png, pdf)
- [x] Remove JWT_SECRET hardcoded fallback (require env var)
- [x] Add rate limiting on auth endpoints (express-rate-limit)
- [x] Encrypt sensitive fields at rest (account_no, ifsc_code, aadhaar)
- [x] Add security headers (helmet)

### Code Quality (4→9)
- [x] Extract shared validators into src/utils/validation.js (deduplicate 5 login files)
- [ ] Break AdminDashboard.jsx into sub-components
- [ ] Break studentform.js into sub-components
- [x] Consistent error handling (toast everywhere, remove alert())
- [x] Remove dead code and commented-out blocks
- [x] Remove console.logs from production frontend code
- [x] Replace magic numbers with named constants

### Architecture (7→9)
- [x] Add database indexes on frequently queried columns
- [x] Add React Error Boundary

### Testing (6→8)
- [x] Add frontend validation unit tests
- [x] Add frontend component render tests

### UX/Accessibility (5→8)
- [x] Add aria-labels to data tables
- [x] Add proper label htmlFor associations in forms
- [ ] Add focus management after modal open/close

### Documentation (6→8)
- [x] Add API endpoint documentation
- [x] Add inline JSDoc for complex backend functions

---

## GNITS TAL Brief — Additional Requirements

### 20. Share student profile with donor (privacy-controlled)
- [ ] Admin can generate a shareable profile view for a specific donor
- [ ] Privacy controls: admin selects which fields to include/redact before sharing
- [ ] Shareable as PDF or secure link
> Note: GNITS PDF says "Donors will not have direct access to the platform" but Presentation gives donors full dashboard access. Current implementation follows Presentation spec (donor login exists). This feature bridges the gap — admin can share curated profiles even if donors have no login.

### 21. Scheduled/automatic reminders
- [ ] Automatic fee reminders to students when payment is due (based on fee_structures due dates)
- [ ] Document submission deadline reminders
- [ ] Event/workshop reminders tied to camps or scheduled events
- [ ] Cron-based or scheduled job to send reminders (not just admin-initiated broadcasts)

### 22. Email delivery for notifications
- [ ] Email service integration (e.g., Nodemailer, SendGrid, or SES)
- [ ] Send notification emails for: fee reminders, document upload alerts, broadcast messages
- [ ] Configurable per-user email preference (opt-in/opt-out)

### 23. Summary dashboards
- [ ] Total funds utilized overview (admin/trustee)
- [ ] Girl-wise report: total fees paid, balance, donor, academic status — all in one view
- [ ] High-level KPI cards: total beneficiaries, total funds collected, total funds pending

---

## Optional / Future Phase (from GNITS TAL Brief)

### 24. Mobile App (iOS/Android)
- [ ] React Native or PWA version of the portal

### 25. WhatsApp integration for alerts
- [ ] WhatsApp Business API integration for sending reminders/alerts

### 26. Mentorship / skill workshop tracking
- [ ] Track mentoring sessions and skill workshops per student
- [ ] Link to camp participation or create separate workshop tracking

### 27. Career progress / alumni tracking
- [ ] Alumni profiles with career progress updates
- [ ] Post-scholarship outcome tracking

---

## Audit Summary

### Presentation (Touch A Life Presentation (2).pdf)
All requirements accounted for. Open items by stakeholder:
- **Students:** Fee alert to trustees pending (#11 — requires #6)
- **Volunteers:** Configure Fee Alerts (#12), Track Your Target (#12), Print Donation Receipts (#4/#12)
- **Trustees:** Entire role not yet built — #6 (9 sub-items)
- **Donors:** Online donation recording flow — #4
- **Auditors:** Entire role not yet built — #7 (2 reports + filtering/export)
- **Reports:** Monthly/Quarterly/Yearly Financial Need Report — #16
- **Form Fields:** All confirmed present including Members in Family

### GNITS TAL Brief (GNITS TAL (1).pdf)
Most requirements already covered. New gaps added:
- Share student profile with donor (privacy-controlled) — #20
- Scheduled/automatic reminders — #21
- Email delivery for notifications — #22
- Summary dashboards (total funds, girl-wise, KPI cards) — #23
- Optional/future: Mobile app (#24), WhatsApp (#25), Workshop tracking (#26), Alumni tracking (#27)

**Profile fields:** All covered — photo (passport_photo), Aadhaar (aadhaar_url), academic year/stream (education dropdowns), all family/income fields.
**Admin filters:** Donor filter already implemented in admin dashboard.
**Payment history export:** Covered by existing fee reports with CSV/PDF export.
