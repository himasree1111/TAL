# Supabase Configuration Guide for Custom Auth

## Environment Variables Setup

Create a `.env` file in your project root with these variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Developer Settings
REACT_APP_ENV=development
DEBUG=supabase:*
```

## How to Get Your Credentials

### Step 1: Find Supabase Project URL & Key

1. Go to [supabase.com](https://supabase.com) → Login
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public key** → `REACT_APP_SUPABASE_ANON_KEY`

### Step 2: Environment File

**For Development:**

Create `.env` in root:
```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_ENV=development
```

**For Production:**

Add to your deployment platform:
- Vercel: Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
- Docker: Pass as build args
- AWS Amplify: Environment variables

### Step 3: Enable Supabase Auth

In Supabase Dashboard:

1. Go to **Authentication**
2. Check settings:
   - [ ] Email/Password enabled
   - [ ] Email confirmation: **OFF** (as per requirement)
   - [ ] Auto confirm user: **ON**
   - [ ] Disable signup: Check if needed

### Step 4: Test Connection

After setting variables, your app will log:

```
Supabase URL: https://xxxxxxxxx.supabase.co
Supabase Key exists: true
Supabase client created successfully
```

## RLS (Row Level Security) Configuration

### Prerequisite: Enable RLS

In Supabase Dashboard → SQL Editor → Run once:

```sql
ALTER TABLE public.eligible_students ENABLE ROW LEVEL SECURITY;
```

### Current Policies

The migrations automatically create these policies:

| Policy Name | Who | When | Action |
|-------------|-----|------|--------|
| anonymous_can_check_eligibility | Anon users | SELECT | Check if eligible |
| students_can_select_own_record | Auth users | SELECT | View own record |
| students_can_update_own_record | Auth users | UPDATE | Edit own record |
| service_role_can_manage | Backend | ALL | Admin operations |

### Verify Policies

Dashboard → **Tables** → **eligible_students** → **RLS**

Should see these policies:
- [ ] Policy 1: anonymous_can_check_eligibility
- [ ] Policy 2: students_can_select_own_record
- [ ] Policy 3: students_can_update_own_record
- [ ] Policy 4: service_role_can_manage

## Database Schema Verification

### Check Column Exists

In SQL Editor:

```sql
-- View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'eligible_students'
ORDER BY ordinal_position;
```

Should include `auth_id` with type `uuid`.

### Check Indexes

```sql
-- View indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'eligible_students';
```

Should see:
- [ ] idx_eligible_students_auth_id
- [ ] idx_eligible_students_email

## API Configuration

### CORS Settings

If accessing from different domain, in Supabase:

Dashboard → **Settings** → **API**

Set CORS headers (usually auto-configured).

### Auth Redirects

Update redirect URLs for password reset:

1. Dashboard → **Authentication** → **URL Configuration**
2. Add these redirects:
   - `http://localhost:3000/student-login` (dev)
   - `http://localhost:3000/reset-password` (dev)
   - `https://yourdomain.com/reset-password` (production)

## Testing Your Setup

### Test 1: Check Connection

```bash
# In browser console
// Should NOT show errors in console
open http://localhost:3000
```

Watch console for:
```
✅ Supabase URL: https://xxx.supabase.co
✅ Supabase Key exists: true
✅ Supabase client created successfully
```

### Test 2: Check RLS

In SQL Editor:

```sql
-- This should work (anon user checking eligibility)
SELECT email, auth_id FROM public.eligible_students LIMIT 1;
```

### Test 3: Auth Signup

Manual test:

```javascript
// In browser console
import supabase from './src/supabaseClient';

const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'TestPassword123!@#'
});

console.log(data, error);
```

Should return user object with `id`.

## Security Best Practices

### ✅ DO

- [ ] Keep anon key public (it's public anyway)
- [ ] Never expose service role key (SECRET KEY)
- [ ] Use environment variables for sensitive data
- [ ] Implement RLS on all tables
- [ ] Use HTTPS in production
- [ ] Rotate keys periodically
- [ ] Monitor auth logs regularly

### ❌ DON'T

- [ ] Commit `.env` to git
- [ ] Store passwords in database
- [ ] Disable RLS in production
- [ ] Use service role key in frontend
- [ ] Trust client-side validation alone
- [ ] Log passwords or tokens

## Environment-Specific Configuration

### Local Development

```env
REACT_APP_SUPABASE_URL=https://dev-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=dev-key
REACT_APP_ENV=development
DEBUG=supabase:*
```

### Staging

```env
REACT_APP_SUPABASE_URL=https://staging-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=staging-key
REACT_APP_ENV=staging
```

### Production

```env
REACT_APP_SUPABASE_URL=https://prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=prod-key
REACT_APP_ENV=production
DEBUG=
```

## Troubleshooting Connection Issues

### Error: "Supabase environment variables not set!"

**Solution:**
1. Check `.env` file exists in root
2. Restart dev server: `npm start`
3. Verify variable names (case-sensitive!)

### Error: "Failed to fetch from Supabase"

**Solution:**
1. Check URL is correct (no typos)
2. Check key is valid
3. Check Supabase project is not paused
4. Check CORS settings

### Error: "RLS policy error"

**Solution:**
1. Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Re-run RLS policies SQL
3. Check policy logic with test user

### Error: "Cannot read property 'auth' of undefined"

**Solution:**
1. Import authService.js correctly
2. Check Supabase client is initialized
3. Check supabaseClient.js exports default

## Advanced Configuration

### Custom JWT Claims

In Supabase Dashboard → **Authentication** → **JWT**:

Add custom claims in user metadata:

```json
{
  "student_id": "uuid-here",
  "role": "student"
}
```

Use in policies:

```sql
WHERE auth.jwt()->'user_metadata'->>'student_id' = id::text
```

### Webhook Configuration

Set up webhooks for auth events:

Dashboard → **Database** → **Webhooks**

Example webhook:

```
Event: auth user created
Destination: https://yourdomain.com/api/auth-webhook
```

### Realtime Subscriptions

Monitor login attempts:

```javascript
const subscription = supabase
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'eligible_students' },
    payload => console.log('Change received!', payload)
  )
  .subscribe();
```

## Monitoring & Debugging

### View Auth Logs

Dashboard → **Logs** → **Auth**

Filter by:
- User email
- Event type (signup, login, logout)
- Status (success, failed)
- Date range

### Common Auth Events

| Event | Meaning |
|-------|---------|
| user_signup | User created account |
| user_signedin | User logged in |
| user_signedout | User logged out |
| user_updated | User changed password |
| failed_second_factor | MFA failed |
| invalid_credentials | Wrong password |
| user_sso_signin | SSO login |

### Performance Monitoring

Expected response times:

```
GET user info: < 50ms
POST signup: 500-1000ms
POST login: 500-1000ms
RLS policy check: < 10ms
```

If slower, check:
- Database indexes
- Network latency
- Supabase project tier

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **JavaScript Client:** https://supabase.com/docs/reference/javascript
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Discord:** https://discord.supabase.io
- **Email:** support@supabase.io

---

**Configuration Version:** 1.0  
**Last Updated:** April 2026  
**Tested With:** Supabase v2.0+
