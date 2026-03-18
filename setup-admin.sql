-- ============================================
-- SETUP ADMIN USER
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: First, create the auth user in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: sammyseth260@gmail.com
-- 4. Password: (set a secure password)
-- 5. Auto Confirm User: YES
-- 6. Click "Create User" and COPY THE USER ID

-- STEP 2: Find the user ID if you already created the user
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'sammyseth260@gmail.com';

-- STEP 3: Replace 'PASTE_USER_ID_HERE' below with the actual UUID from above, then run:

-- Insert or update admin user profile
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'PASTE_USER_ID_HERE'::uuid, -- Replace with actual UUID
  'sammyseth260@gmail.com',
  'super_admin',
  'Admin',
  'User',
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

-- Update existing user to admin (use the ID from the SELECT above)
-- UPDATE users 
-- SET role = 'super_admin', is_active = true
-- WHERE email = 'sammyseth260@gmail.com';
