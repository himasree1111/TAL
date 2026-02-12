# TAL Portal — Intern Code Evaluation

**Reviewer:** Senior Technical Lead
**Date:** February 10, 2026
**Scope:** Full-stack code review of the TAL (Touch A Life) scholarship management portal
**Team:** Student Interns

---

## Executive Summary

The TAL Portal is a functional scholarship management app with four user roles (Student, Volunteer, Donor, Admin), built with React + Express + SQLite. The interns demonstrated solid understanding of React fundamentals, component-based architecture, and basic full-stack integration. However, the codebase has significant gaps in security, testing, code organization, and production-readiness that are typical of early-career developers who haven't yet worked on systems handling real user data.

**Overall Score: 5/10** — Functional prototype, not production-ready.

---

## What's Good

### 1. Working End-to-End Flows
The core user journeys work: volunteers can sign up, log in, fill out multi-page student forms, upload documents, view/edit/delete submissions, and log out. The admin dashboard pulls real data and displays it meaningfully. This is the hardest part of any project — making the thing actually work — and they delivered it.

### 2. Role-Based Architecture
Four distinct roles with separate login pages, dashboards, and access control. Each login page checks `user_metadata.user_type` and rejects unauthorized roles. This shows the team thought about authorization from the start, not as an afterthought.

### 3. Comprehensive Form Validation (`studentform.js`)
The student application form has genuinely thorough validation:
- Real-time feedback on every field (phone numbers, email, percentages, IFSC codes)
- Input masking (digits-only for phone, auto-uppercase for IFSC, decimal limiting for percentages)
- Dynamic family/earning member sub-forms that grow/shrink based on count
- Full validation sweep on submit with scroll-to-first-error

This level of UX polish on form validation is above average for an intern project.

### 4. Clean UI with Proper Libraries
Good choices: React Router v7, React Toastify for notifications, Lucide React for icons, Framer Motion for animations. The Donor Dashboard (`DonorDashboard.js`) in particular shows clean component decomposition — sidebar, metric cards, overview, table, chart — all as separate functions with clear responsibilities.

### 5. Education Dropdown System
`EducationDropdown.js` implements a three-level cascading dropdown (Category → Subcategory → Year) with "Other" custom input at each level and auto-composed class strings. This is a non-trivial UI pattern handled correctly.

### 6. Consistent CSS Organization
Each component has its own CSS file (`VolunteerDashboard.css`, `AdminDashboard.css`, `studentlogin.css`, etc.) using kebab-case class names. The styling is consistent within each component and the dashboards look professional.

---

## What Needs Improvement

### Critical Issues

#### 1. Security — Hardcoded Secrets and Open Endpoints
**Severity: CRITICAL**

```javascript
// backend/server.js:14
const JWT_SECRET = "tal-portal-secret-key-change-in-production";
```

The JWT signing secret is hardcoded in source code. Anyone who reads the repo can forge authentication tokens for any user. This single line makes the entire auth system meaningless.

Additionally:
- `app.use(cors())` allows requests from any origin — should be restricted to the frontend domain
- Data endpoints (`/api/student-forms`, `/api/admin/students`) have **no authentication middleware** — anyone can read all student data without logging in
- Uploaded files (Aadhaar cards, income proofs, marksheets) are served as public static files with no access control
- No rate limiting on login endpoint — vulnerable to brute force attacks

**What to do:** Move secrets to environment variables. Add the `authenticateToken` middleware (it's defined but never used!) to all data endpoints. Serve uploads through an authenticated endpoint, not a public static directory. Add `express-rate-limit`.

#### 2. Zero Test Coverage
**Severity: CRITICAL**

The only test file (`App.test.js`) is the default CRA boilerplate. Zero tests for:
- Validation logic (the most testable part of the codebase)
- API endpoint behavior
- Auth flows
- Component rendering

For a project handling sensitive personal data (Aadhaar numbers, bank accounts, income proofs), this is unacceptable. At minimum, the validation functions should have comprehensive unit tests — they're pure functions, which are the easiest thing to test.

#### 3. Sensitive Data Stored in Plaintext
**Severity: HIGH**

Bank account numbers, IFSC codes, Aadhaar numbers, and income proof URLs are stored as plaintext in SQLite. If the database file is ever exposed (backup leak, misconfigured server, stolen laptop), all student financial data is compromised.

At minimum, fields like `account_no`, `ifsc_code`, and `aadhaar_url` should be encrypted at rest using a library like `crypto` with AES-256.

### Architectural Issues

#### 4. Giant Components
**Severity: HIGH**

| File | Lines | Problem |
|------|-------|---------|
| `studentform.js` | 1,449 | Form logic, validation, file upload, API calls, and all rendering in one file |
| `AdminDashboard.jsx` | 1,446+ | Dashboard, modals, filters, settings, reports, CSV export all in one file |

These files are doing 5-10 different jobs each. They're hard to read, hard to debug, and impossible to test in isolation. A form component shouldn't also be responsible for file upload logic and API calls.

**What to do:** Extract into focused modules:
- `useStudentForm.js` (custom hook for form state/validation)
- `useFileUpload.js` (upload logic)
- `StudentFormSections/` (PersonalInfo, AcademicInfo, Documents — render components)
- `AdminStudentTable.js`, `AdminSettings.js`, `AdminReports.js` (break up dashboard)

#### 5. Copy-Pasted Code Across Login Pages
**Severity: MEDIUM**

The password validation function is duplicated verbatim in 5 files:

```javascript
// Identical in: volunteerlogin.js, studentlogin.js, donorlogin.js, adminlogin.js, register.js
const validatePassword = (value) => {
  const errors = [];
  if (!/[a-z]/.test(value)) errors.push("Must include a lowercase letter");
  if (!/[A-Z]/.test(value)) errors.push("Must include an uppercase letter");
  if (!/[0-9]/.test(value)) errors.push("Must include a number");
  if (!/[@$!%*?&]/.test(value)) errors.push("Must include a special character");
  if (value.length < 8) errors.push("Must be at least 8 characters long");
  return errors;
};
```

Same for `validateName` and `validateEmail`. If the password policy changes, you have to update 5 files. This is how bugs are born.

**What to do:** Create `src/utils/validation.js` with shared validators. Import everywhere.

#### 6. Hardcoded URLs Everywhere
**Severity: MEDIUM**

```javascript
// src/api.js:3
const API_BASE = "http://localhost:4000";

// src/studentform.js:420
"http://localhost:4000/api/upload"

// src/register.js:65
axios.post("http://localhost:4000/register", ...)

// backend/server.js:355
`http://localhost:3000/reset-password?token=...`
```

The app will break the moment it's deployed anywhere other than localhost. All URLs should come from environment variables.

### Code Quality Issues

#### 7. Inconsistent Error Handling Patterns
**Severity: MEDIUM**

The codebase uses three different error reporting patterns interchangeably:

```javascript
// Pattern 1: alert() — poor UX, blocks the thread
alert("Error saving student: " + result.error.message);  // studentform.js

// Pattern 2: toast — good, non-blocking
toast.error(err.message);  // volunteerlogin.js

// Pattern 3: console.error only — user sees nothing
console.error('Error fetching student data:', studentError);  // AdminDashboard.jsx
```

Pick one pattern and use it consistently. Toast notifications are the right choice — they're already imported everywhere.

#### 8. Missing Loading States and Error Boundaries
**Severity: MEDIUM**

When the admin dashboard fetches student data, there's a loading spinner. Good. But if the fetch fails, `studentError` is logged to console and the user sees... an empty table with no explanation. Same pattern in VolunteerDashboard — if the API is down, you get a blank page.

There's no React Error Boundary anywhere. If any component throws during render, the entire app crashes to a white screen.

#### 9. localStorage for JWT Tokens
**Severity: MEDIUM**

```javascript
// src/api.js:7-11
const TOKEN_KEY = "tal_auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
```

localStorage is accessible to any JavaScript running on the page, including XSS payloads. If an attacker injects script (and there's no Content Security Policy or input sanitization to prevent it), they get the auth token.

The safer approach is httpOnly cookies set by the server, which JavaScript can't read.

#### 10. No Database Indexes
**Severity: LOW (now), HIGH (at scale)**

The `student_form_submissions` table will be queried by `volunteer_email`, `status`, and `created_at` constantly, but there are no indexes on these columns. With 100 students this doesn't matter; with 10,000 it will grind to a halt.

```sql
CREATE INDEX IF NOT EXISTS idx_submissions_volunteer ON student_form_submissions(volunteer_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON student_form_submissions(status);
```

#### 11. File Upload Has No Type Restrictions
**Severity: MEDIUM**

The multer config only limits file size (50MB), not file type. A user could upload an executable, a zip bomb, or a 49MB random file. The upload endpoint should validate MIME types:

```javascript
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  cb(null, allowed.includes(file.mimetype));
};
```

#### 12. Accessibility Gaps
**Severity: MEDIUM**

- Tables in VolunteerDashboard and AdminDashboard lack `aria-label` attributes
- Many form inputs in `studentform.js` don't have proper `<label htmlFor>` associations
- No skip-to-content link for keyboard users
- Color-only status indicators (no icons/text alternatives for colorblind users)
- No focus management after form submission or modal open/close

#### 13. Magic Numbers and Unnamed Constants
**Severity: LOW**

```javascript
// studentform.js:244 — why 15?
if (value > 15) value = "15";

// studentform.js:281 — why 10?
if (value > 10) value = "10";

// server.js:15 — why 7 days?
const JWT_EXPIRY = "7d";
```

These should be named constants with comments explaining the business rule.

#### 14. Console Logs Left in Production Code
**Severity: LOW**

`console.log` and `console.error` calls are scattered throughout both frontend and backend. These should be removed or replaced with a proper logging library (e.g., `winston` for backend, nothing for frontend in production).

#### 15. Dead Code and Commented-Out Blocks
**Severity: LOW**

- `studentdashboard.js` was entirely commented out (recently fixed)
- `studentlogin.js` and `donorlogin.js` were entirely commented out (recently fixed)
- `CoverPage.js` has ~95 lines of dead commented code
- `AdminDashboard.jsx` has multiple commented-out fields (lines 66-68, 79-80, 100-104)
- `testSupabase.js` exists as an empty placeholder

Dead code creates confusion about what's active and what's deprecated. Delete it — that's what version control is for.

---

## Scoring Breakdown

| Category | Weight | Score (1-10) | Notes |
|----------|--------|-------------|-------|
| **Functionality** | 25% | 7 | Core flows work. Student form is comprehensive. Admin dashboard is feature-rich. |
| **Code Quality** | 20% | 4 | Giant components, duplicated code, inconsistent patterns. Readable but poorly organized. |
| **Security** | 20% | 2 | Hardcoded secrets, no auth on data endpoints, plaintext sensitive data, public file uploads. |
| **Architecture** | 15% | 5 | Good role separation and component structure. No shared utilities, no state management, no API abstraction layer (until recently). |
| **Testing** | 10% | 1 | Effectively zero test coverage. |
| **UX/Accessibility** | 5% | 5 | Good form validation UX. Poor accessibility. Professional-looking UI. |
| **Documentation** | 5% | 4 | CLAUDE.md exists and is helpful. No API docs, no inline docs, poor commit messages. |

### **Weighted Total: 4.3/10**

### **Final Score: 5/10** (rounded up to account for the fact that, as an intern project, getting a working full-stack app with four roles, file uploads, and a 50-field multi-page form is a genuine accomplishment)

---

## What I'd Tell the Interns

**The good news:** You built a working full-stack application with real complexity — multi-role auth, a 50-field form with cascading dropdowns and file uploads, an admin dashboard with filtering and reports. Most intern teams don't get this far. The fact that a user can sign up, fill out a form, upload documents, and an admin can review it end-to-end is the foundation of a real product.

**The growth areas** are all things you learn through experience building production systems:

1. **Security is not optional.** The moment you handle someone's Aadhaar number and bank details, you're legally and ethically responsible for that data. Never hardcode secrets. Always encrypt sensitive fields. Always authenticate your endpoints.

2. **If you copy-paste code, you've made a design mistake.** Every time you copied `validatePassword` into another file, that was a signal to extract it into a shared module. Train yourself to notice that signal.

3. **Big files are a smell.** When a file hits 500 lines, stop and ask "what are the 3 different things this file is doing?" Then split it. Your future self (and your teammates) will thank you.

4. **Write tests for the boring stuff.** You don't need 100% coverage. But pure functions like `validateField`, `validatePassword`, `transformStudentRow` — these are trivially testable and catch the most bugs. Start there.

5. **Think about what happens when things go wrong.** What if the API is down? What if the upload fails halfway? What if the user has JavaScript disabled? Production code is 30% happy path and 70% error handling.

You're on the right track. Keep building.

---

*End of evaluation.*
