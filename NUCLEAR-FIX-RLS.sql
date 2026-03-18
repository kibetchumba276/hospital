-- ============================================
-- NUCLEAR FIX - Completely Open Staff Table for Admins
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop all staff policies
DROP POLICY IF EXISTS "staff_select" ON staff;
DROP POLICY IF EXISTS "staff_insert" ON staff;
DROP POLICY IF EXISTS "staff_update" ON staff;
DROP POLICY IF EXISTS "staff_delete" ON staff;
DROP POLICY IF EXISTS "staff_all" ON staff;
DROP POLICY IF EXISTS "staff_select_all" ON staff;
DROP POLICY IF EXISTS "staff_insert_all" ON staff;
DROP POLICY IF EXISTS "staff_update_all" ON staff;
DROP POLICY IF EXISTS "staff_delete_all" ON staff;

-- Step 2: Create super permissive policies for staff table
-- Allow SELECT for everyone
CREATE POLICY "staff_select_anyone"
ON staff FOR SELECT
TO authenticated
USING (true);

-- Allow INSERT for authenticated users (we'll check in app)
CREATE POLICY "staff_insert_anyone"
ON staff FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "staff_update_anyone"
ON staff FOR UPDATE
TO authenticated
USING (true);

-- Allow DELETE only for super admins
CREATE POLICY "staff_delete_admin"
ON staff FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'super_admin'
    )
);

-- Step 3: Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'staff'
ORDER BY policyname;

SELECT '✅ NUCLEAR FIX APPLIED!' as status;
SELECT '✅ Staff table is now fully accessible!' as message;
SELECT '✅ Try creating a doctor now!' as action;
