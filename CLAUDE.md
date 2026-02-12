# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TAL (Touch A Life) Portal — a full-stack scholarship management web app for the Touch A Life Foundation. Four user roles: Student, Volunteer, Donor, Admin. Each role has its own login, dashboard, and workflow.

## Build & Run Commands

### Frontend (React / Create React App)
```bash
npm install                  # Install frontend dependencies
npm start                    # Dev server on port 3000
npm run build                # Production build
npm test                     # Jest tests (minimal coverage currently)
```

### Backend (Express + Turso/libSQL)
```bash
cd backend && npm install    # Install backend dependencies
node backend/server.js       # Express API server on port 4000
```

Frontend proxy is configured to `http://localhost:4000` in package.json (dev only).

### Deployment (Vercel)
```bash
vercel --prod                # Deploy to Vercel
```

Set environment variables in Vercel Dashboard (see `.env.example`).

## Architecture

### Unified Express + Turso Backend
The app uses a single Express backend (`backend/server.js`) with JWT auth. Database is Turso (managed libSQL) in production, local SQLite file in dev.

- **Database wrapper:** `backend/db.js` — async wrapper over `@libsql/client` that mirrors the `better-sqlite3` API shape. All db calls return Promises.
- **Database:** Turso (remote) via `TURSO_DATABASE_URL` env var, or local `backend/app.db` file when not set
- **Tables:** `users`, `student_form_submissions`, `fee_payments`, `donor_mapping`, `notifications`, `donations`, `fee_structures`, `documents`, `camps`, `camp_participation`, `academic_records`
- **Auth:** JWT tokens (7-day expiry), stored in localStorage. User metadata shape matches former Supabase format.
- **File uploads:** Multer → AWS S3 (when `AWS_S3_BUCKET` is set) or local `backend/uploads/` (fallback)
- **Init:** `async initDb()` creates tables on first run; called by `api/index.js` (Vercel) or `app.listen()` (local)

### Vercel Deployment
- **Serverless entry:** `api/index.js` wraps the Express app for Vercel's serverless functions
- **Config:** `vercel.json` routes `/api/*` and `/uploads/*` to the serverless function, serves React build as static
- **Environment:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `FRONTEND_URL`, and AWS S3 vars set in Vercel Dashboard

### Frontend Adapter Layer
`src/api.js` provides a Supabase-compatible API surface (auth, query builder, storage) backed by axios calls to the Express backend. `src/supabaseClient.js` re-exports this adapter, so all components use it transparently without import changes. `API_BASE` is `""` (empty string) — relative URLs work via CRA proxy (dev) and Vercel rewrites (prod).

### Frontend Structure (src/)
- **Entry/Routing:** `App.js` (React Router v7), `CoverPage.js` (landing), `loginProfiles.js` (role selector)
- **Volunteer flow:** `volunteerlogin.js` → `VolunteerDashboard.js`, `VolunteerProfile.js`
- **Student flow:** `studentlogin.js` → `studentform.js` (multi-page) → `studentdashboard.js`
- **Donor flow:** `donorlogin.js` → `DonorDashboard.js`
- **Admin flow:** `adminlogin.js` → `AdminDashboard.jsx` (most feature-rich)
- **Shared:** `ResetPassword.js`, `EducationDropdown.js`, `NestedAcademicDropdown.js`
- **Adapter:** `api.js` (Supabase-compatible adapter), `supabaseClient.js` (re-export)
- **Styling:** Per-component CSS files + Tailwind CSS

### Backend API (backend/server.js, port 4000)

**Auth endpoints:**
- `POST /api/auth/signup` — register (accepts options.data.user_type)
- `POST /api/auth/login` — login, returns JWT + user object
- `POST /api/auth/logout` — clears session (stateless)
- `GET /api/auth/session` — verify Bearer token
- `GET /api/auth/user` — get current user
- `PUT /api/auth/user` — update password/metadata
- `POST /api/auth/reset-password` — generate reset token (logged to console)
- `POST /api/auth/reset-password/confirm` — verify token, set new password

**Data endpoints:**
- `GET/POST /api/student-forms` — list/create student submissions
- `PUT/DELETE /api/student-forms/:id` — update/delete
- `GET /api/admin/students` — all submissions (admin view)
- `PUT /api/admin/students/:id` — update status
- `GET /api/admin/eligible` — eligible students (status filter)
- `GET /api/admin/non-eligible` — non-eligible students

**File upload:**
- `POST /api/upload` — multipart file upload → S3 (or local `backend/uploads/`)
- `GET /uploads/*` — static file serving (local dev only)

**Legacy:**
- `POST /register` — old volunteer registration (still works)

### Auth Pattern
- JWT stores `{ id, email, name, role }` with 7-day expiry
- User object includes `user_metadata.user_type` for role checking
- Each login page checks existing session and redirects if already authenticated
- Password validation: min 8 chars, upper+lower+number+special character
- Password reset: token logged to server console (no email service); uses `FRONTEND_URL` env var for reset link

## Key Conventions

- **File naming:** Mixed — kebab-case (`volunteerlogin.js`) and PascalCase (`VolunteerDashboard.js`) coexist
- **CSS classes:** kebab-case (`.volunteer-dashboard`)
- **JS variables:** camelCase
- **DB columns/tables:** snake_case
- **DB calls:** All `db.prepare().get/all/run()` and `db.exec()` are **async** — always `await` them
- **UI libraries:** Lucide React (icons), Framer Motion (animations), React Toastify (notifications)

## Known Issues
- Password reset uses console-logged URLs (no email service)
- Production build fails on CSS minimization (Tailwind v4 + CRA compat issue, pre-existing)
