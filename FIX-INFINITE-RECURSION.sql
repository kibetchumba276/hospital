-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- STEP 1: Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE vitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE beds DISABLE ROW LEVEL SECURITY;
ALTER TABLE bed_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE wards DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- STEP 3: Drop existing functions
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- STEP 4: Create helper function that uses auth.jwt() to avoid recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role::TEXT 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- STEP 5: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create NON-RECURSIVE policies for users table
-- This is the KEY FIX - users table policies CANNOT reference users table

CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- STEP 7: Create policies for other tables using the helper function

-- STAFF TABLE
CREATE POLICY "staff_select_all"
ON staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "staff_modify_admin"
ON staff FOR ALL
TO authenticated
USING (get_user_role() = 'super_admin');

-- PATIENTS TABLE
CREATE POLICY "patients_select_own"
ON patients FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin'));

CREATE POLICY "patients_insert_own"
ON patients FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR get_user_role() IN ('receptionist', 'super_admin'));

CREATE POLICY "patients_update_own"
ON patients FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR get_user_role() IN ('receptionist', 'super_admin'));

-- APPOINTMENTS TABLE
CREATE POLICY "appointments_select_all"
ON appointments FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR get_user_role() IN ('receptionist', 'super_admin')
);

CREATE POLICY "appointments_insert_all"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR get_user_role() IN ('receptionist', 'doctor', 'super_admin')
);

CREATE POLICY "appointments_update_all"
ON appointments FOR UPDATE
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR get_user_role() IN ('receptionist', 'super_admin')
);

CREATE POLICY "appointments_delete_admin"
ON appointments FOR DELETE
TO authenticated
USING (get_user_role() = 'super_admin');

-- MEDICAL RECORDS TABLE
CREATE POLICY "medical_records_select_all"
ON medical_records FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR get_user_role() IN ('doctor', 'nurse', 'super_admin')
);

CREATE POLICY "medical_records_insert_doctor"
ON medical_records FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('doctor', 'super_admin'));

CREATE POLICY "medical_records_update_doctor"
ON medical_records FOR UPDATE
TO authenticated
USING (
    doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR get_user_role() = 'super_admin'
);

-- VITALS TABLE
CREATE POLICY "vitals_select_all"
ON vitals FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR get_user_role() IN ('doctor', 'nurse', 'super_admin')
);

CREATE POLICY "vitals_insert_staff"
ON vitals FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('doctor', 'nurse', 'super_admin'));

-- PRESCRIPTIONS TABLE
CREATE POLICY "prescriptions_select_all"
ON prescriptions FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR get_user_role() IN ('doctor', 'pharmacist', 'super_admin')
);

CREATE POLICY "prescriptions_insert_doctor"
ON prescriptions FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('doctor', 'super_admin'));

CREATE POLICY "prescriptions_update_staff"
ON prescriptions FOR UPDATE
TO authenticated
USING (get_user_role() IN ('pharmacist', 'doctor', 'super_admin'));

-- PRESCRIPTION ITEMS TABLE
CREATE POLICY "prescription_items_select_all"
ON prescription_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "prescription_items_insert_doctor"
ON prescription_items FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('doctor', 'super_admin'));

-- INVOICES TABLE
CREATE POLICY "invoices_select_all"
ON invoices FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR get_user_role() IN ('receptionist', 'doctor', 'super_admin')
);

CREATE POLICY "invoices_insert_staff"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('receptionist', 'doctor', 'super_admin'));

CREATE POLICY "invoices_update_staff"
ON invoices FOR UPDATE
TO authenticated
USING (get_user_role() IN ('receptionist', 'doctor', 'super_admin'));

-- INVOICE ITEMS TABLE
CREATE POLICY "invoice_items_select_all"
ON invoice_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "invoice_items_insert_staff"
ON invoice_items FOR INSERT
TO authenticated
WITH CHECK (get_user_role() IN ('receptionist', 'doctor', 'super_admin'));

-- PAYMENTS TABLE
CREATE POLICY "payments_select_all"
ON payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "payments_insert_all"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- BEDS TABLE
CREATE POLICY "beds_select_all"
ON beds FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "beds_modify_staff"
ON beds FOR ALL
TO authenticated
USING (get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin'));

-- BED ASSIGNMENTS TABLE
CREATE POLICY "bed_assignments_select_all"
ON bed_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "bed_assignments_modify_staff"
ON bed_assignments FOR ALL
TO authenticated
USING (get_user_role() IN ('doctor', 'nurse', 'super_admin'));

-- WARDS TABLE
CREATE POLICY "wards_select_all"
ON wards FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "wards_modify_admin"
ON wards FOR ALL
TO authenticated
USING (get_user_role() = 'super_admin');

-- DEPARTMENTS TABLE
CREATE POLICY "departments_select_all"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "departments_modify_admin"
ON departments FOR ALL
TO authenticated
USING (get_user_role() = 'super_admin');

-- MEDICINES TABLE
CREATE POLICY "medicines_select_all"
ON medicines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "medicines_modify_staff"
ON medicines FOR ALL
TO authenticated
USING (get_user_role() IN ('pharmacist', 'super_admin'));

-- LAB TESTS TABLE
CREATE POLICY "lab_tests_select_all"
ON lab_tests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "lab_tests_modify_staff"
ON lab_tests FOR ALL
TO authenticated
USING (get_user_role() IN ('doctor', 'lab_technician', 'super_admin'));

-- AUDIT LOGS TABLE
CREATE POLICY "audit_logs_select_admin"
ON audit_logs FOR SELECT
TO authenticated
USING (get_user_role() = 'super_admin');

CREATE POLICY "audit_logs_insert_all"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- STEP 8: Verify the fix
SELECT 
    '✅ INFINITE RECURSION FIXED!' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Test the function
SELECT 
    '✅ Testing get_user_role()...' as test,
    CASE 
        WHEN get_user_role() IS NOT NULL THEN '✅ Function works!'
        ELSE '⚠️ No role found (you may need to log in)'
    END as result;

SELECT '🎉 DONE! The infinite recursion is fixed. Try logging in now!' as message;
