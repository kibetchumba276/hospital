-- ============================================
-- FIX: Allow Admin to View All Users
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create a function to check if current user is admin
-- This function is SECURITY DEFINER and STABLE to avoid recursion
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
$$;

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- Step 2: Drop existing users SELECT policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Step 3: Create new SELECT policy that allows:
-- 1. Users to see their own record
-- 2. Super admins to see ALL records
CREATE POLICY "users_select_all"
ON users FOR SELECT
TO authenticated
USING (
    id = auth.uid() 
    OR 
    is_super_admin()
);

-- Step 4: Update the UPDATE policy to allow admins to update any user
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

CREATE POLICY "users_update_all"
ON users FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR
    is_super_admin()
);

-- Step 5: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

SELECT '✅ Admin can now view all users!' as status;
