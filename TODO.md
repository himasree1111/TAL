# TODO: Fix Admin Dashboard Empty Beneficiaries Issue

## Problem
- Admin Dashboard "Manage Beneficiaries" shows empty array instead of volunteer-submitted forms
- Forms are submitted to Supabase, but Admin fetches from Supabase and gets empty data (likely RLS or table issues)
- Backend uses SQLite, creating inconsistency

## Solution
- Switch data flow to use backend SQLite consistently
- Add backend endpoints for fetching data
- Update forms to submit to backend
- Update dashboards to fetch from backend

## Tasks
- [x] Add GET /volunteer-id/:email endpoint to backend
- [x] Add GET /students endpoint to backend (modified to filter by volunteer_email)
- [x] Update AdminDashboard.jsx to fetch from backend instead of Supabase
- [x] Update VolunteerDashboard.js to fetch from backend instead of Supabase
- [x] Update studentform.js to submit to backend instead of Supabase
- [ ] Test the full flow: form submission -> backend storage -> admin/volunteer dashboard display
- [ ] Handle file uploads (currently to Supabase storage, may need to change to local or another service)

## Notes
- Backend fields: full_name, school_college, previous_percentage, present_percentage, etc.
- Form fields: first_name + middle_name + last_name, school, prev_percent, present_percent, etc.
- Need field mapping for consistency
- Current data in Supabase may need migration or will be lost (start fresh)
