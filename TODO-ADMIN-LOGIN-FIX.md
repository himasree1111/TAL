# Admin Login Implementation (Custom Auth)
Status: [IN PROGRESS] 🚧

## Steps:

### 1. ✅ Database Migration
- Created `supabase/migrations/001-add-admin-password.sql`
- Add `password` column to `admins` table 
- Set initial password "Admin@2014" for `info@touchalifeorg.com`
- **Run this SQL in Supabase dashboard!**

### 2. ✅ Update adminlogin.js
- ✅ Replaced Supabase auth with `supabase.from('admins').select()` 
- ✅ Hardcoded email + exact password match (plain text)
- ✅ localStorage `admin_token` set on success
- ✅ Console.log exact messages for wrong email/password
- ✅ Navigate to `/admin-dashboard`
- ✅ Disabled sign-up/forgot password UI

### 3. [ ] Update ResetPassword.js
- After `supabase.auth.updateUser({ password })`, add `supabase.from('admins').update({ password: newPassword }).eq('email', ...)`
- Redirect to `/adminlogin?role=admin`

### 4. ✅ Update AdminDashboard.jsx
- ✅ Added admin_token check BEFORE Supabase session (redirects to /adminlogin if missing)
- ✅ Enhanced logout clears token + Supabase session

### 5. [ ] Test
- Execute SQL migration
- Login: `info@touchalifeorg.com` / `Admin@2014` → dashboard
- Wrong email → console "only admins can login"
- Correct email/wrong pass → console "wrong credentials/password"  
- Password reset → new password works
- Access dashboard directly → redirects to login

### 6. [ ] Cleanup
- Remove old Supabase auth checks
- Update any ProtectedRoute.js if needed
- Mark complete ✅

