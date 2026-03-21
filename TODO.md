# Notification Fix - Debug Mode

**Current Status**: Code fixed but needs console/DB check

## Immediate Debug:
1. Browser F12 → Console → Login to student-dashboard
2. **PASTE ALL LOGS HERE** (search for "Student Type", "[FILTER]", errors)

3. **Supabase Check**:
   - Go to Supabase → Table Editor → notifications
   - Login as student user → Can you see data?
   - RLS Policy? (select * where true?)

4. **Quick Test Route** (add to App.js):
```
<Route path="/test-notifications" element={<TestNotifications />} />
```

**Suspected Issues**:
- RLS blocking query
- No data or audience mismatch
- studentEmail null

Paste logs to diagnose!
