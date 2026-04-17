-- ADD Voucher Columns to fee_tracking (COMPLETE)
-- Run this FULL file in Supabase SQL Editor

-- Add voucher_url if missing
ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS voucher_url text;

-- Add voucher_uploaded_at if missing
ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS voucher_uploaded_at timestamptz DEFAULT now();

-- Verify both columns exist
SELECT 
  '✅ Voucher columns ready' as status,
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'fee_tracking' 
  AND column_name IN ('voucher_url', 'voucher_uploaded_at');

-- Test query
SELECT id, email, voucher_url, voucher_uploaded_at 
FROM fee_tracking 
WHERE voucher_url IS NOT NULL 
ORDER BY voucher_uploaded_at DESC 
LIMIT 3;

