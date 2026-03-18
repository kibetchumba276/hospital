-- ============================================
-- FIX ALL ERRORS - COMPREHENSIVE SOLUTION
-- Run this script to fix all common issues
-- ============================================

-- STEP 1: Check if user exists in auth but not in users table
SELECT 
    'Users in auth.users but NOT in users table' as issue,
    au.id,
    au.email,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL;

-- STEP 2: Fix missing user profiles
-- This creates user profiles for any auth users that don't have them
INSERT INTO users (id, email, role, first_name, last_name, is_active)
SELECT 
    au.id,
    au.email,
    'patient' as role, -- Default to patient
    COALESCE(au.raw_user_meta_data->>'first_name', 'User') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name') as last_name,
    true as is_active
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Create patient records for users with patient role but no patient record
INSERT INTO patients (user_id)
SELECT u.id
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
WHERE u.role = 'patient' AND p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- STEP 4: Verify the fix
SELECT 
    'Verification: All auth users now have profiles' as check_type,
    COUNT(*) as auth_users,
    (SELECT COUNT(*) FROM users) as user_profiles,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM users) 
        THEN '✅ FIXED - All users have profiles'
        ELSE '❌ STILL BROKEN - Some users missing profiles'
    END as status
FROM auth.users;

-- STEP 5: Check specific user (sammyseth260@gmail.com)
SELECT 
    'sammyseth260@gmail.com Status' as check_type,
    au.id as auth_id,
    au.email,
    au.email_confirmed_at,
    u.id as user_profile_id,
    u.role,
    u.is_active,
    CASE 
        WHEN u.id IS NOT NULL AND u.role = 'super_admin' 
        THEN '✅ READY - Can login as admin'
        WHEN u.id IS NOT NULL 
        THEN '⚠️ EXISTS but not admin - Update role'
        ELSE '❌ MISSING - Create profile'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE au.email = 'sammyseth260@gmail.com';

-- STEP 6: If sammyseth260@gmail.com exists but isn't admin, fix it
UPDATE users 
SET role = 'super_admin', is_active = true
WHERE email = 'sammyseth260@gmail.com';

-- STEP 7: List all users and their status
SELECT 
    au.email,
    au.email_confirmed_at as confirmed,
    u.role,
    u.is_active,
    CASE 
        WHEN u.id IS NULL THEN '❌ NO PROFILE'
        WHEN u.role = 'patient' AND NOT EXISTS (SELECT 1 FROM patients WHERE user_id = u.id) THEN '❌ NO PATIENT RECORD'
        WHEN u.role = 'doctor' AND NOT EXISTS (SELECT 1 FROM staff WHERE user_id = u.id) THEN '❌ NO STAFF RECORD'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;

-- STEP 8: Fix RLS policies if needed
-- Drop and recreate the get_user_role function
DROP FUNCTION IF EXISTS get_user_role();
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT COALESCE(role, 'patient'::user_role) FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop and recreate the is_admin function
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- STEP 9: Ensure RLS policies allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- STEP 10: Ensure RLS policies allow users to insert their own profile during registration
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- STEP 11: Final verification
SELECT 
    '=== FINAL STATUS ===' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM users) as total_user_profiles,
    (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as admins,
    (SELECT COUNT(*) FROM users WHERE role = 'doctor') as doctors,
    (SELECT COUNT(*) FROM users WHERE role = 'patient') as patients,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM users)
        THEN '✅ ALL FIXED'
        ELSE '❌ STILL ISSUES'
    END as status;

-- STEP 12: Show what to do next
SELECT 
    'NEXT STEPS' as action,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE email = 'sammyseth260@gmail.com')
        THEN '1. Create admin user in Supabase Dashboard > Authentication > Users'
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE email = 'sammyseth260@gmail.com' AND role = 'super_admin')
        THEN '2. Admin user exists but role is wrong - FIXED by this script'
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE role = 'doctor')
        THEN '3. Login as admin and create doctors at /admin/doctors'
        ELSE '4. ✅ System ready! Try logging in'
    END as instruction;
