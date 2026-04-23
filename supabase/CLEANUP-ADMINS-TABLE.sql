-- ADMIN EMAIL RESTRICTION: Cleanup Script (COMPLETE)
-- Run ALL in Supabase SQL Editor

-- 1. CREATE admins table if missing + UNIQUE email
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Check current admins
SELECT * FROM admins;

-- 3. Delete ALL non-approved emails (BACKUP FIRST!)
DELETE FROM admins WHERE email != 'info@touchalifeorg.com';

-- 4. Insert super admin
INSERT INTO admins (email) VALUES ('info@touchalifeorg.com');

-- 5. Final verification
SELECT COUNT(*) as admin_count FROM admins WHERE email = 'info@touchalifeorg.com';


