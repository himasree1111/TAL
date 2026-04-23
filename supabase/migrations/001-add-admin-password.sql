-- Add password column to admins table and set initial admin password
-- Run this in Supabase SQL Editor

-- 1. Enable pgcrypto if not already (for future hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add password column (VARCHAR for plain text simplicity)
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 3. Set initial password for the admin email
UPDATE admins 
SET password = 'Admin@2014' 
WHERE email = 'info@touchalifeorg.com';

-- 4. Verify
SELECT email, password FROM admins WHERE email = 'info@touchalifeorg.com';

-- 5. Make password NOT NULL for future (existing record already has value)
ALTER TABLE admins 
ALTER COLUMN password SET NOT NULL;

