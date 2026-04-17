-- Fix Missing Voucher Columns in fee_tracking
-- Run this in Supabase SQL Editor BEFORE voucher upload

ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS voucher_url text;

ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS voucher_uploaded_at timestamptz;

-- Verify columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'fee_tracking' 
  AND column_name IN ('voucher_url', 'voucher_uploaded_at')
ORDER BY ordinal_position;

SELECT '✅ Voucher columns added. Try voucher upload again.' as status;

