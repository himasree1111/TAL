# Custom Auth Flow - Code Examples & API Reference

## Quick Reference: Auth Functions

### 1. Check Eligibility

```javascript
import { checkEligibility } from './authService';

// Usage
const student = await checkEligibility('student@example.com');

// Response
{
  id: "uuid-123",
  email: "student@example.com",
  full_name: "John Doe",
  auth_id: null  // null = first-time user
}

// Or null if not eligible
null
```

**When to use:**
- Before showing password field
- To display student name
- To check if first-time or returning user

---

### 2. Sign Up New User

```javascript
import { handleSignup } from './authService';

// Usage
const { user, session } = await handleSignup(
  'student@example.com',
  'SecurePass123!@#'
);

// Response
{
  user: {
    id: "auth-uuid-456",
    email: "student@example.com",
    email_confirmed_at: "2024-04-26T10:30:00Z"
  },
  session: {
    access_token: "eyJhbGc...",
    refresh_token: "...",
    expires_in: 3600
  }
}
```

**When to use:**
- First-time user account creation
- Automatically stores auth_id in eligible_students

**Error handling:**
```javascript
try {
  const { user, session } = await handleSignup(email, password);
  // Success - user has auth_id now
} catch (err) {
  if (err.message.includes('already exists')) {
    // Email already registered
  } else if (err.message.includes('link account')) {
    // Failed to store auth_id
  }
}
```

---

### 3. Login Existing User

```javascript
import { handleLogin } from './authService';

// Usage
const { user, session } = await handleLogin(
  'student@example.com',
  'SecurePass123!@#'
);

// Response
{
  user: {
    id: "auth-uuid-456",
    email: "student@example.com"
  },
  session: {
    access_token: "eyJhbGc...",
    expires_in: 3600
  }
}
```

**When to use:**
- Returning user wants to log in
- Email has auth_id already set

**Error handling:**
```javascript
try {
  const { user, session } = await handleLogin(email, password);
} catch (err) {
  if (err.message.includes('Invalid')) {
    // Wrong password or email not found
    toast.error("Invalid email or password");
  } else {
    toast.error("Login failed");
  }
}
```

---

### 4. Verify User After Login

```javascript
import { verifyUserAuth } from './authService';

// Usage
const userData = await verifyUserAuth('auth-uuid-456');

// Response
{
  id: "uuid-123",
  email: "student@example.com",
  full_name: "John Doe",
  auth_id: "auth-uuid-456",
  status: "Eligible"
}

// Or null if not verified
null
```

**When to use:**
- After login, verify user in eligible_students
- Check user status/eligibility
- Get user profile data

**Verification logic:**
```javascript
const user = await getCurrentUser();
if (user) {
  const verified = await verifyUserAuth(user.id);
  if (!verified) {
    // User exists in Auth but not in eligible_students
    // Logout immediately
    await handleLogout();
  }
}
```

---

### 5. Get Current Session

```javascript
import { getCurrentSession } from './authService';

// Usage
const session = await getCurrentSession();

// Response
{
  access_token: "eyJhbGc...",
  refresh_token: "...",
  expires_in: 3600,
  user: {
    id: "auth-uuid-456",
    email: "student@example.com"
  }
}

// Or null if no session
null
```

**When to use:**
- Check if user is logged in
- Get access token for API requests
- Implement session refresh

---

### 6. Get Current User

```javascript
import { getCurrentUser } from './authService';

// Usage
const user = await getCurrentUser();

// Response
{
  id: "auth-uuid-456",
  email: "student@example.com",
  role: "authenticated",
  aud: "authenticated",
  email_confirmed_at: "2024-04-26T10:30:00Z"
}

// Or null if not logged in
null
```

**When to use:**
- Protected route guards
- Display user email in header
- Get user ID for db queries

---

### 7. Logout

```javascript
import { handleLogout } from './authService';

// Usage
await handleLogout();

// Clears:
// - Supabase auth session
// - localStorage (studentEmail, studentId, studentAuthToken)
```

**When to use:**
- Logout button clicked
- Session expired
- Security issue detected

---

## Real-World Code Examples

### Example 1: Protected Route

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from './authService';

function ProtectedRoute({ children }) {
  const [isAuthed, setIsAuthed] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/student-login');
      } else {
        setIsAuthed(true);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isAuthed === null) {
    return <div>Loading...</div>;
  }

  return isAuthed ? children : null;
}

export default ProtectedRoute;
```

---

### Example 2: API Request with Auth Token

```javascript
// Get auth token
const token = localStorage.getItem('studentAuthToken');

// Make request
const response = await fetch('/api/student-profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Or with axios
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('studentAuthToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use it
const profile = await api.get('/student-profile');
```

---

### Example 3: Session Refresh

```javascript
import { useEffect } from 'react';
import supabase from './supabaseClient';

function useSessionRefresh() {
  useEffect(() => {
    // Set up auto-refresh
    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          localStorage.setItem('studentAuthToken', session.access_token);
        }
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('studentAuthToken');
        }
      }
    );

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);
}

export default useSessionRefresh;
```

---

### Example 4: Password Validation

```javascript
// Reusable component
function PasswordValidator({ password, onChange }) {
  const requirements = [
    {
      name: 'Lowercase',
      regex: /[a-z]/,
    },
    {
      name: 'Uppercase',
      regex: /[A-Z]/,
    },
    {
      name: 'Number',
      regex: /[0-9]/,
    },
    {
      name: 'Special Character',
      regex: /[@$!%*?&]/,
    },
    {
      name: 'At least 8 characters',
      regex: /.{8,}/,
    },
  ];

  const strength = requirements.filter(req => req.regex.test(password)).length;
  const isValid = strength === requirements.length;

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => onChange(e.target.value)}
        className={isValid ? 'valid' : 'invalid'}
      />

      <div className="strength-meter">
        <div
          className="strength-bar"
          style={{
            width: `${(strength / requirements.length) * 100}%`,
          }}
        />
      </div>

      <ul>
        {requirements.map(req => (
          <li key={req.name} style={{
            color: req.regex.test(password) ? 'green' : 'red'
          }}>
            {req.name}
          </li>
        ))}
      </ul>

      <button disabled={!isValid}>Continue</button>
    </div>
  );
}
```

---

### Example 5: Role-Based Access Control

```javascript
import supabase from './supabaseClient';

async function checkUserRole(userId) {
  const { data } = await supabase
    .from('eligible_students')
    .select('status')
    .eq('auth_id', userId)
    .single();

  return data?.status; // 'Eligible', 'Rejected', etc.
}

// Usage
const user = await getCurrentUser();
const status = await checkUserRole(user.id);

if (status !== 'Eligible') {
  toast.error('Your status has been changed');
  await handleLogout();
}
```

---

## Error Handling Patterns

### Pattern 1: Comprehensive Error Handler

```javascript
async function handleAuthError(err, context) {
  console.error(`[${context}] Error:`, err);

  const errorMap = {
    'already exists': 'This email is already registered',
    'Invalid login credentials': 'Wrong email or password',
    'User not found': 'Email not found',
    'Email not confirmed': 'Please verify your email first',
    'Passwords do not match': 'Please verify your passwords',
    'link account': 'Failed to create account. Please try again',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (err.message.includes(key)) {
      return message;
    }
  }

  return 'An error occurred. Please try again.';
}

// Usage
try {
  await handleSignup(email, password);
} catch (err) {
  const message = await handleAuthError(err, 'SIGNUP');
  toast.error(message);
}
```

---

### Pattern 2: Retry Logic

```javascript
async function retryAsync(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const { user, session } = await retryAsync(
  () => handleLogin(email, password),
  3,
  1000
);
```

---

## Debugging Techniques

### Log Auth Flow

```javascript
// Add to authService.js
const DEBUG = process.env.REACT_APP_ENV === 'development';

export const checkEligibility = async (email) => {
  DEBUG && console.log('[AUTH] Checking eligibility for:', email);
  
  try {
    const { data, error } = await supabase
      .from("eligible_students")
      .select("id, email, auth_id")
      .ilike("email", email.trim())
      .maybeSingle();

    if (data) {
      DEBUG && console.log('[AUTH] ✓ User eligible, auth_id:', data.auth_id);
    } else {
      DEBUG && console.log('[AUTH] ✗ User not eligible');
    }

    return data;
  } catch (err) {
    DEBUG && console.error('[AUTH] Error checking eligibility:', err);
    throw err;
  }
};
```

### Check localStorage

```javascript
// In browser console
localStorage.getItem('studentAuthToken')
localStorage.getItem('studentEmail')
localStorage.getItem('studentId')

// Clear all
localStorage.clear()
```

### Monitor Auth Events

```javascript
import supabase from './supabaseClient';

// Listen to auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('[AUTH EVENT]', event, session?.user?.email);
  }
);

// Later: unsubscribe
subscription?.unsubscribe();
```

---

## Performance Tips

### Debounce Eligibility Check

```javascript
import { useCallback, useState, useRef } from 'react';

function StudentLoginForm() {
  const [email, setEmail] = useState('');
  const debounceTimer = useRef(null);

  const checkEligibilityDebounced = useCallback((email) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkEligibility(email);
    }, 500); // Wait 500ms after user stops typing
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    checkEligibilityDebounced(e.target.value);
  };

  return <input onChange={handleEmailChange} />;
}
```

### Cache User Data

```javascript
let cachedUser = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCurrentUserCached() {
  const now = Date.now();
  
  if (cachedUser && (now - cacheTime) < CACHE_DURATION) {
    return cachedUser;
  }

  const user = await getCurrentUser();
  if (user) {
    cachedUser = user;
    cacheTime = now;
  }

  return user;
}
```

---

## Security Checklist

✅ Implement in your app:

- [ ] Never store plain passwords
- [ ] Use HTTPS in production
- [ ] Implement session timeout
- [ ] Validate all inputs server-side
- [ ] Use CSRF tokens for form submissions
- [ ] Implement rate limiting on auth endpoints
- [ ] Log auth failures for detection
- [ ] Use secure HTTP-only cookies if possible
- [ ] Implement email verification
- [ ] Add multi-factor authentication option

---

## Testing Checklist

Test these scenarios:

- [ ] New user signup flow
- [ ] Returning user login
- [ ] Wrong password attempts
- [ ] Ineligible email rejection
- [ ] Session persistence
- [ ] Logout and cleanup
- [ ] Protected route access
- [ ] Token refresh mechanism
- [ ] Password validation all requirements
- [ ] Concurrent login attempts

---

**Reference Version:** 1.0  
**Last Updated:** April 2026  
**Language:** JavaScript/React
