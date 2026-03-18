-- ============================================
-- FIX MISSING USER PROFILES
-- Run this when you get "Failed to fetch profile"
-- ============================================

-- This script finds users in auth.users that don't have profiles in users table
-- and creates the missing profiles

-- Step 1: Check which users are missing profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NULL THEN 'MISSING PROFILE' ELSE 'Has Profile' END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;

-- Step 2: Create missing profiles for ALL users
-- This will create patient profiles by default for any user without a profile

INSERT INTO users (id, email, role, first_name, last_name, is_active)
SELECT 
  au.id,
  au.email,
  'patient' as role,
  COALESCE(au.raw_user_meta_data->>'first_name', 'User') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', au.email) as last_name,
  true as is_active
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create patient records for users with patient role
INSERT INTO patients (user_id)
SELECT u.id
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
WHERE u.role = 'patient' AND p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Verify all users now have profiles
SELECT 
  au.id,
  au.email,
  u.role,
  u.first_name,
  u.last_name,
  CASE 
    WHEN u.role = 'patient' THEN p.id::text
    WHEN u.role = 'doctor' THEN s.staff_number
    ELSE 'N/A'
  END as identifier
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
LEFT JOIN patients p ON p.user_id = u.id
LEFT JOIN staff s ON s.user_id = u.id
ORDER BY au.created_at DESC;

-- ============================================
-- SPECIFIC USER FIX
-- If you know the email of the user having issues
-- ============================================

-- Replace 'user@email.com' with the actual email
DO $$
DECLARE
  user_id_var UUID;
  user_email_var TEXT := 'mwinzmatdev@gmail.com'; -- CHANGE THIS
BEGIN
  -- Get user ID
  SELECT id INTO user_id_var FROM auth.users WHERE email = user_email_var;
  
  IF user_id_var IS NOT NULL THEN
    -- Create user profile
    INSERT INTO users (id, email, role, first_name, last_name, is_active)
    VALUES (
      user_id_var,
      user_email_var,
      'patient',
      'Mat',
      'Sam',
      true
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'patient', is_active = true;
    
    -- Create patient record
    INSERT INTO patients (user_id)
    VALUES (user_id_var)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Profile created for %', user_email_var;
  ELSE
    RAISE NOTICE 'User not found: %', user_email_var;
  END IF;
END $$;

-- Verify the specific user
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  u.role,
  u.first_name,
  u.last_name,
  p.id as patient_id
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
LEFT JOIN patients p ON p.user_id = u.id
WHERE au.email = 'mwinzmatdev@gmail.com';

-- ============================================
-- QUICK FIX FOR CURRENT USER
-- ============================================

-- If you just registered with mwinzmatdev@gmail.com, run this:
-- (The script above already handles it, but this is a manual alternative)

/*
-- Get the user ID first
SELECT id FROM auth.users WHERE email = 'mwinzmatdev@gmail.com';

-- Then insert profile (replace USER_ID)
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID'::uuid,
  'mwinzmatdev@gmail.com',
  'patient',
  'Mat',
  'Sam',
  true
);

INSERT INTO patients (user_id)
VALUES ('USER_ID'::uuid);
*/
