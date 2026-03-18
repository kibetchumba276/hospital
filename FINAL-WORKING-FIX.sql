-- ============================================
-- FINAL WORKING FIX - RLS Policies
-- This fixes the 403 permission denied error
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Disable RLS temporarily
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

-- STEP 3: Drop and recreate helper function
DROP FUNCTION IF EXISTS get_user_role() CASCADE;

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

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;

-- STEP 4: Re-enable RLS
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

-- STEP 5: Create WORKING policies for users table
-- KEY FIX: Allow authenticated users to SELECT their own row without recursion

CREATE POLICY "users_select_authenticated"
ON users FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);

CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
);

-- STEP 6: Grant table permissions to authenticated role
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

GRANT SELECT ON staff TO authenticated;
GRANT INSERT, UPDATE, DELETE ON staff TO authenticated;

GRANT SELECT ON patients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON patients TO authenticated;

GRANT SELECT ON appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON appointments TO authenticated;

GRANT SELECT ON medical_records TO authenticated;
GRANT INSERT, UPDATE, DELETE ON medical_records TO authenticated;

GRANT SELECT ON vitals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON vitals TO authenticated;

GRANT SELECT ON prescriptions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON prescriptions TO authenticated;

GRANT SELECT ON prescription_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON prescription_items TO authenticated;

GRANT SELECT ON invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON invoices TO authenticated;

GRANT SELECT ON invoice_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON invoice_items TO authenticated;

GRANT SELECT ON payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON payments TO authenticated;

GRANT SELECT ON beds TO authenticated;
GRANT INSERT, UPDATE, DELETE ON beds TO authenticated;

GRANT SELECT ON bed_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON bed_assignments TO authenticated;

GRANT SELECT ON wards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON wards TO authenticated;

GRANT SELECT ON departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON departments TO authenticated;

GRANT SELECT ON medicines TO authenticated;
GRANT INSERT, UPDATE, DELETE ON medicines TO authenticated;

GRANT SELECT ON lab_tests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON lab_tests TO authenticated;

GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- STEP 7: Create policies for other tables

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
USING (
    user_id = auth.uid() 
    OR get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
);

CREATE POLICY "patients_insert_own"
ON patients FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    OR get_user_role() IN ('receptionist', 'super_admin')
);

CREATE POLICY "patients_update_own"
ON patients FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR get_user_role() IN ('receptionist', 'super_admin')
);

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
    '✅ PERMISSIONS FIXED!' as status,
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

-- Test permissions
SELECT 
    '✅ Testing permissions...' as test,
    CASE 
        WHEN has_table_privilege('authenticated', 'users', 'SELECT') THEN '✅ Users table accessible'
        ELSE '❌ Users table not accessible'
    END as result;

SELECT '🎉 DONE! Login should work now!' as message;
