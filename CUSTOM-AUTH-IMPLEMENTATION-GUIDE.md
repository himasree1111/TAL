# Student Login Custom Authentication Flow - Implementation Guide

## Overview

This guide implements a **custom authentication flow** for student login using Supabase Auth with eligibility verification. The system ensures only verified eligible students can create accounts and log in.

## Architecture

### Flow Diagram

```
┌─────────────────┐
│ Student enters  │
│ email address   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Check eligibility in        │
│ eligible_students table     │
└────────┬────────────────────┘
         │
         ├─ NOT ELIGIBLE
         │  └─> Show error: "You are not eligible"
         │
         └─ ELIGIBLE
            ├─ auth_id IS NULL (First-time user)
            │  └─> Show "Create Password" form
            │      └─> handleSignup()
            │          ├─ Supabase.auth.signUp()
            │          ├─ Store auth_id in eligible_students
            │          └─> Redirect to Dashboard
            │
            └─ auth_id IS NOT NULL (Existing user)
               └─> Show "Login" form
                   └─> handleLogin()
                       ├─ Supabase.auth.signInWithPassword()
                       ├─ Verify auth.uid() in eligible_students
                       └─> Redirect to Dashboard
```

## Database Schema

### Add `auth_id` Column

Run this migration to add the auth_id column to `eligible_students`:

```sql
ALTER TABLE public.eligible_students
ADD COLUMN auth_id uuid DEFAULT NULL,
ADD CONSTRAINT eligible_students_auth_id_unique UNIQUE (auth_id);

CREATE INDEX IF NOT EXISTS idx_eligible_students_auth_id 
  ON public.eligible_students(auth_id);

CREATE INDEX IF NOT EXISTS idx_eligible_students_email 
  ON public.eligible_students(email);
```

**Column Details:**
- `auth_id`: Stores the Supabase Auth user ID
- UNIQUE constraint ensures one-to-one mapping between auth user and eligible student
- Indexes improve query performance

### RLS Policies

The `eligible_students_rls_policies.sql` file contains security policies:

1. **Anonymous users** can check eligibility (read-only on email check)
2. **Authenticated students** can only see/update their own records
3. **Service role** (backend) can perform admin operations

## Implementation Files

### 1. `authService.js` - Core Authentication Logic

**Module exports:**
- `checkEligibility(email)` - Verify if email exists in eligible_students
- `handleSignup(email, password)` - Create new auth user and store auth_id
- `handleLogin(email, password)` - Login existing user
- `verifyUserAuth(userId)` - Verify logged-in user exists in eligible_students
- `getCurrentSession()` - Get current auth session
- `getCurrentUser()` - Get current authenticated user
- `handleLogout()` - Logout and clear localStorage

**Key Features:**
- Async/await error handling
- Proper exception handling with meaningful error messages
- Stores session info (token) for API requests
- Validates eligibility before signup

### 2. `studentlogin.js` - Updated Login Component

**Key Changes:**
- Removed direct password comparison from database
- Uses Supabase Auth for authentication
- Real-time eligibility checking as user types email
- Distinct UX for first-time vs returning users
- Stores auth token in localStorage for authenticated requests

**Flow:**
1. User enters email → Check eligibility
2. If first-time user (auth_id IS NULL) → Show "Create Password"
3. If existing user → Show "Enter Password"
4. On submit → Trigger either signup or login

### 3. `SetPassword.js` - Updated Password Creation

**Key Changes:**
- Uses `handleSignup()` from authService
- Calls `Supabase.auth.signUp()` instead of storing password in DB
- Automatically logs in user after successful signup
- Pre-fills password from login form for UX

**Flow:**
1. Receives email & password from student login
2. Validates password requirements
3. Calls `handleSignup(email, password)`
4. Stores auth_id in eligible_students
5. Redirects to dashboard

## Step-by-Step Setup

### Step 1: Database Migration

Run the migration files in this order:

```bash
# Add auth_id column
psql -d your_db < migrations/add_auth_id_to_eligible_students.sql

# Configure RLS policies
psql -d your_db < migrations/eligible_students_rls_policies.sql
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy & run each migration file
3. Verify tables have new column and policies

### Step 2: Update Frontend Files

1. **Create `authService.js`** (provided)
   - Copy the complete authService.js file
   - Place in `src/` directory

2. **Replace `studentlogin.js`** (provided)
   - Backup current file
   - Replace with updated version

3. **Replace `SetPassword.js`** (provided)
   - Backup current file
   - Replace with updated version

### Step 3: Environment Variables

Ensure `.env` file contains:

```env
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional
REACT_APP_ENV=development
```

### Step 4: Install Dependencies

Supabase client is likely already installed, but verify:

```bash
npm install @supabase/supabase-js
```

### Step 5: Test the Flow

**Test First-Time User:**
1. Go to `/student-login`
2. Enter email of eligible but new student
3. Verify password field appears
4. Enter valid password
5. Click "Continue"
6. Confirm password
7. Click "Create Account"
8. Should redirect to dashboard
9. Check `eligible_students` table → `auth_id` should be populated

**Test Returning User:**
1. Go to `/student-login`
2. Enter email of already-registered student
3. Enter password
4. Click "Login"
5. Should redirect to dashboard

**Test Ineligible User:**
1. Go to `/student-login`
2. Enter email NOT in `eligible_students`
3. Should show error: "You are not eligible to access this dashboard"

## Security Features

### 1. Eligibility Verification
- Email checked against `eligible_students` before any auth operation
- Prevents unauthorized signups

### 2. Password Security
- Passwords never stored in `eligible_students` table
- Stored securely by Supabase Auth
- Supports password reset via Supabase

### 3. Session Management
- Uses Supabase auth tokens
- Token stored in localStorage for API requests
- Can implement token refresh logic

### 4. RLS Protection
- Row-level security prevents data leaks
- Students can only see/modify their own records
- Service role for admin operations

## Advanced Features (Optional)

### Password Reset Flow

Add this to authService.js:

```javascript
export const requestPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password?role=student`,
      }
    );
    
    if (error) throw error;
    return true;
  } catch (err) {
    throw err;
  }
};
```

### Email Verification (Optional)

If you want to require email verification:

```javascript
// In handleSignup()
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password: password.trim(),
  options: {
    emailRedirectTo: `${window.location.origin}/student-dashboard`,
    data: {
      full_name: studentData.full_name,
    },
  },
});
```

### Multi-factor Authentication

```javascript
export const enableMFA = async (userId) => {
  // Implement MFA setup
  // Requires additional Supabase configuration
};
```

## Troubleshooting

### Issue: "auth_id is NULL for existing users"

**Solution:**
1. Delete Supabase Auth user from dashboard
2. User logs in again (new signup)
3. auth_id will be stored

### Issue: "RLS policy error"

**Solution:**
1. Check RLS policies are enabled on table
2. Verify policies match your auth setup
3. Check auth.uid() === auth_id in policies

### Issue: "User created in Auth but not in eligible_students"

**Solution:**
1. Verify `handleSignup()` runs both steps
2. Check error logs for update failure
3. May indicate email not in eligible_students table

### Issue: "Password requirements showing but can't click submit"

**Solution:**
1. Verify all password requirements are met
2. Check `button` is not disabled by form validation
3. Clear browser cache and retry

## Best Practices Implemented

✅ **Modular Code**
- Separate `authService.js` for reusable auth logic
- Clear function names explaining purpose
- Documented with JSDoc comments

✅ **Error Handling**
- Try-catch blocks on all async operations
- User-friendly error messages via toast
- Console logging for debugging

✅ **Performance**
- Eligibility check on email blur (not on every keystroke)
- Early validation before expensive operations
- Indexes on email and auth_id columns

✅ **Security**
- No plain-text passwords in database
- RLS protection on all data access
- JWT tokens for API requests

✅ **UX**
- Real-time eligibility feedback
- Clear password requirements
- Loading states during signup/login
- Helpful error messages

## Integration Points

### Update Student Dashboard

When user logs in, store needed info:

```javascript
// After successful login
const user = await supabase.auth.getUser();
localStorage.setItem("studentId", user.id);
localStorage.setItem("studentAuthToken", session.access_token);

// In protected routes
const token = localStorage.getItem("studentAuthToken");
const studentId = localStorage.getItem("studentId");
```

### API Requests

Add auth header to all requests:

```javascript
const headers = {
  Authorization: `Bearer ${localStorage.getItem("studentAuthToken")}`,
  "Content-Type": "application/json",
};

fetch(url, { headers });
```

### Logout Handling

```javascript
import { handleLogout } from "./authService";

const handleLogout = async () => {
  await handleLogout();
  navigate("/student-login");
};
```

## Migration Checklist

- [ ] Backup eligible_students table
- [ ] Run SQL migrations
- [ ] Verify auth_id column exists
- [ ] Verify RLS policies created
- [ ] Copy authService.js to src/
- [ ] Update studentlogin.js
- [ ] Update SetPassword.js
- [ ] Test with new user signup
- [ ] Test with existing user login
- [ ] Test with ineligible email
- [ ] Check localStorage after login
- [ ] Verify auth token in API requests

## Maintenance

### Regular Tasks

1. **Monitor auth failures** - Check logs for suspicious patterns
2. **Review password requirements** - Adjust if needed
3. **Backup auth users** - Via Supabase dashboard
4. **Test password reset** - Ensure email works

### Updating Logic

To modify eligibility check:
```javascript
// Edit authService.js checkEligibility()
// Change query if needed
```

To modify password requirements:
```javascript
// Edit validatePassword() in studentlogin.js and SetPassword.js
// Update regex patterns
```

## Support & Debugging

Enable debug logging:

```javascript
// In src/index.js or main component
if (process.env.REACT_APP_ENV === 'development') {
  localStorage.debug = 'supabase:*';
}
```

Check Supabase logs:
1. Dashboard → Logs → Auth events
2. Look for failed_second_factor, invalid_credentials, etc.
3. Match timestamps to user reports

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Production Ready
