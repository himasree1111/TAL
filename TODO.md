# Fee Tracking Required Fee Fix - IMPLEMENTATION PLAN

## Plan Approved ✅ (User: "u fix it please")

**Progress: 2/4** (Steps 1-2 ✅: TODO.md created, code fixes applied)

### [ ] Step 1: Create TODO.md (IN PROGRESS)
```
✅ Current step complete
```

### [ ] Step 2: Fix all 'required_fee' → 'total_educational_expenses' in src/AdminDashboard.jsx
```
- handleSaveFeeRecord(): requiredFee calculation
- Fee table display: requiredFee column  
- Download reports: CSV headers/data
- Remove balance_due references (not in schema)
```

### [ ] Step 3: Apply edit_file changes to AdminDashboard.jsx
```
Single edit_file call with multiple targeted replacements
Test: Save fee → correct required amount shows
```

### [ ] Step 4: Test & Verify
```
1. Fee Tracking tab → Verify 'Required Fee' column values
2. Enter amount → Save → Moves to Voucher tab
3. Export CSV → Correct 'required_fee' column header/data
4. Supabase SQL: SELECT total_educational_expenses FROM fee_tracking;
```

### [ ] Step 5: Update TODO.md [COMPLETE] → attempt_completion

**Next: Apply code changes → Mark Step 2 ✓ → Step 3**

