# Fee Tracking UI Fixes - Breakdown

## Plan Approved ✅

**Step 1: Create fee_tracking records** (via Document Verification ✅)
```
Document Verification → ✅ → Creates fee_tracking row → Shows in Tracking tab
```

**Step 2: Fix Tracking tab display** 
```
Change: eligibleStudentsRaw filter → Pure feeTrackingRecords (paid=0)
Required Fee: record.total_educational_expenses
```

**Step 3: Edit AdminDashboard.jsx**
```
feeTrackingStudents = feeTrackingRecords.filter(record => parseMoney(record.fee_paid_by_tal) <= 0)
Table uses record.total_educational_expenses
```

**Step 4: Test Save flow**
```
Tracking tab → Enter paid amount → Save 
→ Updates fee_paid_by_tal/status/balance_due
→ Refresh → Moves to Voucher tab (paid>0)
```

**Step 5: Test tabs**
```
Tracking: fee_tracking paid=0
Voucher: fee_tracking paid>0, no voucher
Receipts: fee_tracking with voucher_url
```

**Progress: 0/5**
