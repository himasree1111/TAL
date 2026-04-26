# Quick Setup Checklist

## Before You Start
- [ ] Backup your database
- [ ] Backup current `studentlogin.js` and `SetPassword.js`
- [ ] Have Supabase dashboard access

## Step 1: Database Setup (5 minutes)

In your Supabase dashboard, run these SQL commands:

### Step 1a: Add auth_id Column
```sql
ALTER TABLE public.eligible_students
ADD COLUMN auth_id uuid DEFAULT NULL,
ADD CONSTRAINT eligible_students_auth_id_unique UNIQUE (auth_id);

CREATE INDEX IF NOT EXISTS idx_eligible_students_auth_id 
  ON public.eligible_students(auth_id);

CREATE INDEX IF NOT EXISTS idx_eligible_students_email 
  ON public.eligible_students(email);
```
- [ ] Run this in SQL Editor
- [ ] Verify column was added (check table)

### Step 1b: Enable RLS & Create Policies
Copy entire content from `migrations/eligible_students_rls_policies.sql`
- [ ] Run in SQL Editor
- [ ] Check RLS is enabled on table
- [ ] Verify 5 policies were created

## Step 2: Code Setup (5 minutes)

### Step 2a: Create authService.js
- [ ] Copy `src/authService.js` (provided file)
- [ ] Paste into your project `src/` folder

### Step 2b: Update studentlogin.js
- [ ] Replace entire `src/studentlogin.js` with provided version
- [ ] Keep your CSS file unchanged

### Step 2c: Update SetPassword.js
- [ ] Replace entire `src/SetPassword.js` with provided version
- [ ] Keep your CSS file unchanged

## Step 3: Verify Environment (2 minutes)

Check `.env` file has:
```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key-here
```

- [ ] Variables are set
- [ ] No missing quotes

## Step 4: Install Dependencies (2 minutes)

```bash
npm install
```

- [ ] No errors during install

## Step 5: Test in Development (10 minutes)

### Test 1: First-Time User Signup
1. Start your app: `npm start`
2. Go to `/student-login`
3. Enter email of eligible BUT NEW student
4. Click submit
5. Password field should appear
6. Enter valid password (uppercase, lowercase, number, special char, 8+ chars)
7. Click "Continue"
8. Confirm password
9. Click "Create Account"

Expected: 
- [ ] Redirects to dashboard
- [ ] Check DB → auth_id populated for that student
- [ ] Check localStorage → studentId + studentEmail stored

### Test 2: Returning User Login
1. Same email from Test 1
2. Go to `/student-login`
3. Enter password
4. Click "Login"

Expected:
- [ ] Redirects to dashboard
- [ ] localStorage contains token

### Test 3: Ineligible User
1. Go to `/student-login`
2. Enter email NOT in `eligible_students`
3. Click submit

Expected:
- [ ] Error: "You are not eligible to access this dashboard"
- [ ] Does NOT proceed to password screen

### Test 4: Wrong Password
1. Enter email of existing user
2. Enter wrong password
3. Click "Login"

Expected:
- [ ] Error: "Invalid login credentials" or similar
- [ ] Does NOT log in

## Step 6: Verify Database (3 minutes)

After Test 1, check:

```sql
SELECT email, auth_id FROM public.eligible_students 
WHERE email = 'test@example.com';
```

- [ ] auth_id is NOT NULL
- [ ] auth_id is a valid UUID

## Step 7: Check Supabase Auth

In Supabase Dashboard → Authentication → Users

- [ ] Your test user exists
- [ ] Email matches eligible_students email

## Troubleshooting Quick Fixes

### Problem: "Module not found: authService"
**Fix:** 
- [ ] Verify `authService.js` is in `src/` folder
- [ ] Check import path: `import { checkEligibility } from "./authService"`

### Problem: Password field doesn't appear after email
**Fix:**
- [ ] Email must be in `eligible_students` table
- [ ] Check database for typos in email
- [ ] Try another eligible student's email

### Problem: "RLS policy error" or can't check eligibility
**Fix:**
- [ ] Run RLS policies SQL again
- [ ] Make sure RLS is ENABLED on table
- [ ] Check policies in Dashboard → Authentication → Policies

### Problem: Auth signup fails with vague error
**Fix:**
- [ ] Check browser console (F12) for detailed error
- [ ] Check Supabase Dashboard → Logs → Auth
- [ ] Try different password format
- [ ] Verify SUPABASE_URL and ANON_KEY are correct

### Problem: First-time user can't proceed to SetPassword
**Fix:**
- [ ] Verify password meets ALL requirements
- [ ] Check password field shows requirements list
- [ ] Make sure password and confirm match

## Files Changed Summary

| File | Change |
|------|--------|
| `eligible_students` table | Added `auth_id` column |
| `src/studentlogin.js` | Complete rewrite - now uses Supabase Auth |
| `src/SetPassword.js` | Complete rewrite - now uses Supabase Auth |
| `src/authService.js` | NEW - Core auth logic |

## Rollback Plan

If something goes wrong:

1. **Database rollback:**
   ```sql
   ALTER TABLE public.eligible_students DROP COLUMN auth_id;
   ```

2. **Code rollback:**
   ```bash
   git restore src/studentlogin.js src/SetPassword.js
   ```

3. **Delete new file:**
   ```bash
   rm src/authService.js
   ```

## Performance Benchmarks

Expected performance after implementation:

| Operation | Time |
|-----------|------|
| Email eligibility check | < 100ms |
| Signup process | 1-2 seconds |
| Login process | 1-2 seconds |
| Password validation | < 50ms |

## Security Checklist

- [ ] Passwords NOT stored in eligible_students table
- [ ] Auth users created in Supabase Auth
- [ ] auth_id links Auth user to student record
- [ ] RLS policies prevent unauthorized access
- [ ] Local storage used for session token (not plain password)

## Success Indicators

You've successfully implemented when:

1. ✅ New eligible students can sign up with password
2. ✅ Existing users can log in with password
3. ✅ Ineligible emails show error
4. ✅ Database shows auth_id for registered users
5. ✅ Supabase Auth shows new users
6. ✅ localStorage contains studentId after login
7. ✅ No console errors related to auth

## Next Steps After Setup

1. Implement forgot password flow
2. Add email verification (optional)
3. Add multi-factor authentication (optional)
4. Create user profile completion flow
5. Implement session refresh logic
6. Add admin user management

---

**Estimated Total Time:** 30 minutes  
**Difficulty:** Intermediate  
**Support:** Check CUSTOM-AUTH-IMPLEMENTATION-GUIDE.md for detailed documentation
