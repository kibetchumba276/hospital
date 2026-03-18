-- ============================================
-- SETUP ADMIN USER
-- Run this in Supabase SQL Editor
-- ============================================

-- First, create the auth user in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: sammyseth260@gmail.com
-- 4. Password: (set a secure password)
-- 5. Auto Confirm User: YES
-- 6. Copy the User ID that gets generated

-- Then run this SQL (replace YOUR_USER_ID with the actual UUID):

-- Insert admin user profile
INSERT INTO users (id, email, role, first_name, last_name, phone, is_active)
VALUES (
  'YOUR_USER_ID', -- Replace with actual UUID from auth.users
  'sammyseth260@gmail.com',
  'super_admin',
  'Admin',
  'User',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    email = 'sammyseth260@gmail.com',
    is_active = true;

-- Verify the admin user was created
SELECT id, email, role, first_name, last_name, is_active
FROM users
WHERE email = 'sammyseth260@gmail.com';

-- ============================================
-- ALTERNATIVE: If you already have the user in auth.users
-- ============================================

-- Find the user ID
SELECT id, email FROM auth.users WHERE email = 'sammyseth260@gmail.com';

-- Update existing user to admin (use the ID from above)
UPDATE users 
SET role = 'super_admin', is_active = true
WHERE email = 'sammyseth260@gmail.com';
