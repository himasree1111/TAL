-- Fee Tracking Voucher Fix - Add voucher_url if missing
-- Run in Supabase SQL Editor

-- Add voucher_url column if not exists
ALTER TABLE fee_tracking 
ADD COLUMN IF NOT EXISTS voucher_url text;

-- Add voucher_uploaded_at if missing
ALTER TABLE fee_tracking 
ADD
