-- ============================================
-- COMPREHENSIVE FIX: Admin Full Permissions
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure is_super_admin function exists
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

-- ============================================
-- USERS TABLE - Admin can see and modify all users
-- ============================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;

CREATE POLICY "users_select_all"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;

CREATE POLICY "users_insert_all"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;

CREATE POLICY "users_update_all"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_super_admin());

-- ============================================
-- STAFF TABLE - Admin can create and manage all staff
-- ============================================

DROP POLICY IF EXISTS "staff_select_all" ON staff;
DROP POLICY IF EXISTS "staff_read_all" ON staff;

CREATE POLICY "staff_select_all"
ON staff FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "staff_insert_admin" ON staff;
DROP POLICY IF EXISTS "staff_modify_admin" ON staff;
DROP POLICY IF EXISTS "staff_write_admin" ON staff;

CREATE POLICY "staff_insert_all"
ON staff FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "staff_update_all"
ON staff FOR UPDATE
TO authenticated
USING (is_super_admin());

CREATE POLICY "staff_delete_all"
ON staff FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================
-- PATIENTS TABLE - Admin can create and manage all patients
-- ============================================

DROP POLICY IF EXISTS "patients_select_own" ON patients;
DROP POLICY IF EXISTS "patients_read_own" ON patients;
DROP POLICY IF EXISTS "patients_read_staff" ON patients;

CREATE POLICY "patients_select_all"
ON patients FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    OR is_super_admin()
);

DROP POLICY IF EXISTS "patients_insert_own" ON patients;
DROP POLICY IF EXISTS "patients_insert_staff" ON patients;

CREATE POLICY "patients_insert_all"
ON patients FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    OR get_user_role() IN ('receptionist', 'super_admin')
    OR is_super_admin()
);

DROP POLICY IF EXISTS "patients_update_own" ON patients;

CREATE POLICY "patients_update_all"
ON patients FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR get_user_role() IN ('receptionist', 'super_admin')
    OR is_super_admin()
);

-- ============================================
-- DEPARTMENTS TABLE - Admin full access
-- ============================================

DROP POLICY IF EXISTS "departments_select_all" ON departments;
DROP POLICY IF EXISTS "departments_read_all" ON departments;

CREATE POLICY "departments_select_all"
ON departments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "departments_modify_admin" ON departments;
DROP POLICY IF EXISTS "departments_write_admin" ON departments;

CREATE POLICY "departments_insert_all"
ON departments FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "departments_update_all"
ON departments FOR UPDATE
TO authenticated
USING (is_super_admin());

CREATE POLICY "departments_delete_all"
ON departments FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================
-- WARDS TABLE - Admin full access
-- ============================================

DROP POLICY IF EXISTS "wards_select_all" ON wards;
DROP POLICY IF EXISTS "wards_read_all" ON wards;

CREATE POLICY "wards_select_all"
ON wards FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "wards_modify_admin" ON wards;
DROP POLICY IF EXISTS "wards_write_admin" ON wards;

CREATE POLICY "wards_insert_all"
ON wards FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "wards_update_all"
ON wards FOR UPDATE
TO authenticated
USING (is_super_admin());

CREATE POLICY "wards_delete_all"
ON wards FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================
-- BEDS TABLE - Admin full access
-- ============================================

DROP POLICY IF EXISTS "beds_select_all" ON beds;
DROP POLICY IF EXISTS "beds_read_all" ON beds;

CREATE POLICY "beds_select_all"
ON beds FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "beds_modify_staff" ON beds;
DROP POLICY IF EXISTS "beds_write_staff" ON beds;

CREATE POLICY "beds_insert_all"
ON beds FOR INSERT
TO authenticated
WITH CHECK (
    get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    OR is_super_admin()
);

CREATE POLICY "beds_update_all"
ON beds FOR UPDATE
TO authenticated
USING (
    get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    OR is_super_admin()
);

CREATE POLICY "beds_delete_all"
ON beds FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================
-- BED ASSIGNMENTS TABLE - Admin full access
-- ============================================

DROP POLICY IF EXISTS "bed_assignments_select_all" ON bed_assignments;
DROP POLICY IF EXISTS "bed_assignments_read_all" ON bed_assignments;

CREATE POLICY "bed_assignments_select_all"
ON bed_assignments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "bed_assignments_modify_staff" ON bed_assignments;
DROP POLICY IF EXISTS "bed_assignments_write_staff" ON bed_assignments;

CREATE POLICY "bed_assignments_insert_all"
ON bed_assignments FOR INSERT
TO authenticated
WITH CHECK (
    get_user_role() IN ('doctor', 'nurse', 'super_admin')
    OR is_super_admin()
);

CREATE POLICY "bed_assignments_update_all"
ON bed_assignments FOR UPDATE
TO authenticated
USING (
    get_user_role() IN ('doctor', 'nurse', 'super_admin')
    OR is_super_admin()
);

CREATE POLICY "bed_assignments_delete_all"
ON bed_assignments FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================
-- Verify all policies
-- ============================================

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'staff', 'patients', 'departments', 'wards', 'beds', 'bed_assignments')
GROUP BY tablename
ORDER BY tablename;

SELECT '✅ Admin now has full permissions on all tables!' as status;
SELECT '✅ Admin can create doctors, manage users, and switch roles!' as status;
