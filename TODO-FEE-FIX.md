# Voucher Upload Tab Fix Plan

**Problem**: Voucher Uploading tab shows ALL paid records, doesn't filter !voucher_url

**Solution**: Add `voucherNoUploadRecords` filter

**Files to Edit**:
- `src/AdminDashboard.jsx`

**Edit Plan**:
```
1. Add after paidFeeRecords:
const voucherNoUploadRecords = useMemo(() => {
  return paidFeeRecords.filter((record) => !record.voucher_url);
}, [paidFeeRecords]);

2. Change voucher tab from:
paidFeeRecords.map((record) => {

to:
voucherNoUploadRecords.map((record) => {
```

**Dependent Files**: None

**Follow-up**:
- Test upload → student disappears from Voucher tab
- npm start → Fee Tracking → Voucher Uploading → Upload → Gone + in Fee Receipts

Approve to proceed → create TODO.md steps → edit files

