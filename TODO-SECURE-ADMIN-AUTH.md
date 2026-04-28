# Secure Admin Auth Implementation (Password Fix)

## Goal: Remove plain text password storage from admins table and migrate to Supabase Auth

### Steps:
- [x] 1. Create migration SQL: `supabase/migrations/002-secure-admin-auth.sql`
- [x] 2. Update `src/adminlogin.js` — Use Supabase Auth + admin table verification
- [x] 3. Update `src/ResetPassword.js` — Remove admins table password update
- [x] 4. Update `src/AdminDashboard.jsx` — Replace localStorage token with Supabase session
- [x] 5. Update documentation
- [x] 6. Test plan & Post-deployment steps

## Summary of Changes

### Database (`supabase/migrations/002-secure-admin-auth.sql`)
- **Drops** the insecure `password` VARCHAR column from `admins` table
- **Adds** `auth_id UUID` column to link admins to Supabase Auth users
- **Creates** index on `auth_id` for faster lookups

### Login (`src/adminlogin.js`)
- **Removed** hardcoded password check (`'Admin@2014'`)
- **Removed** `localStorage.setItem('admin_token', ...)`
- **Uses** `supabase.auth.signInWithPassword()` for bcrypt-secure authentication
- **Verifies** admin email exists in `admins` table after auth succeeds
- **Signs out** immediately if user is authenticated but not in admins table

### Reset Password (`src/ResetPassword.js`)
- **Removed** plain-text password update to `admins` table
- **Relies** on `supabase.auth.updateUser()` which handles secure bcrypt hashing

### Dashboard (`src/AdminDashboard.jsx`)
- **Replaced** `localStorage.getItem('admin_token')` with `supabase.auth.getSession()`
- **Verifies** email exists in `admins` table before granting access
- **Signs out** automatically if session is invalid or email not in admins table
- **Cleans up** old `admin_token` on logout (backward compatibility)

### Security Improvements
| Before | After |
|--------|-------|
| Plain text password in `admins` table | No password stored in any table |
| Hardcoded password in JavaScript | Supabase Auth with bcrypt hashing |
| `localStorage` token (easily forged) | JWT session with automatic expiry |
| Password visible to anyone with DB access | Passwords handled exclusively by Supabase Auth |

## Post-Deployment Steps (CRITICAL - Must Run in Order)

### Step 1: Run Migration
Execute `supabase/migrations/002-secure-admin-auth.sql` in Supabase SQL Editor:
```sql
-- This adds auth_id and removes the password column
SELECT * FROM information_schema.columns WHERE table_name = 'admins';
```

### Step 2: Create Admin in Supabase Auth
Option A - Supabase Dashboard:
1. Go to Authentication → Users
2. Click "Add User" or "Invite"
3. Enter email: `info@touchalifeorg.com`
4. Set a secure password
5. Create user

Option B - SQL (if you have admin access):
```sql
-- After creating user in Auth dashboard, get their UUID:
SELECT id FROM auth.users WHERE email = 'info@touchalifeorg.com';

-- Then link to admins table:
UPDATE admins 
SET auth_id = 'UUID_FROM_ABOVE' 
WHERE email = 'info@touchalifeorg.com';
```

### Step 3: Verify Setup
```sql
-- Verify no password column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'admins' AND column_name = 'password';
-- Should return 0 rows

-- Verify auth_id is set
SELECT email, auth_id FROM admins;
```

### Step 4: Test the Flow
1. Go to `/adminlogin`
2. Login with the email and password created in Step 2
3. Verify you are redirected to `/admin-dashboard`
4. Verify dashboard loads with your data
5. Click Logout → should redirect to home page
6. Try to access `/admin-dashboard` directly → should redirect to login

### Step 5: Test Password Reset
1. Go to `/adminlogin`
2. Click "Forgot password"
3. Enter admin email
4. Check email for reset link
5. Reset password
6. Login with new password → should work

### Rollback Plan (if needed)
If something breaks, you can temporarily restore the old password column:
```sql
ALTER TABLE admins ADD COLUMN password VARCHAR(255);
UPDATE admins SET password = 'Admin@2014' WHERE email = 'info@touchalifeorg.com';
```
Then revert the frontend code via git.

