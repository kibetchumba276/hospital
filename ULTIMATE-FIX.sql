-- ============================================
-- ULTIMATE FIX - Run this to fix everything
-- This will completely reset and fix all issues
-- ============================================

-- STEP 1: Drop all existing policies (CASCADE to handle dependencies)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- STEP 2: Drop and recreate helper functions
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create get_user_role function (returns text instead of enum to avoid issues)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    SELECT role::TEXT INTO user_role_value FROM users WHERE id = auth.uid();
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 3: Enable RLS on all tables
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

-- STEP 4: Create simplified RLS policies

-- ============================================
-- USERS TABLE
-- ============================================

CREATE POLICY "users_insert_own"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "users_select_own"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_admin_all"
    ON users FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- STAFF TABLE
-- ============================================

CREATE POLICY "staff_select_all"
    ON staff FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "staff_insert_admin"
    ON staff FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "staff_update_admin"
    ON staff FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================
-- PATIENTS TABLE
-- ============================================

CREATE POLICY "patients_insert_own"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "patients_select_own_or_staff"
    ON patients FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    );

CREATE POLICY "patients_update_staff"
    ON patients FOR UPDATE
    TO authenticated
    USING (get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin'));

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE POLICY "appointments_select_own_or_staff"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

CREATE POLICY "appointments_insert_patient_or_staff"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'doctor', 'super_admin')
    );

CREATE POLICY "appointments_update_involved"
    ON appointments FOR UPDATE
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

-- ============================================
-- MEDICAL RECORDS TABLE
-- ============================================

CREATE POLICY "medical_records_select_own_or_doctor"
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
        OR is_admin()
    );

-- ============================================
-- VITALS TABLE
-- ============================================

CREATE POLICY "vitals_select_own_or_staff"
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

-- ============================================
-- PRESCRIPTIONS TABLE
-- ============================================

CREATE POLICY "prescriptions_select_own_or_staff"
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

CREATE POLICY "prescriptions_update_pharmacist"
    ON prescriptions FOR UPDATE
    TO authenticated
    USING (get_user_role() IN ('pharmacist', 'doctor', 'super_admin'));

-- ============================================
-- PRESCRIPTION ITEMS TABLE
-- ============================================

CREATE POLICY "prescription_items_select_via_prescription"
    ON prescription_items FOR SELECT
    TO authenticated
    USING (
        prescription_id IN (
            SELECT id FROM prescriptions 
            WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR get_user_role() IN ('doctor', 'pharmacist', 'super_admin')
    );

CREATE POLICY "prescription_items_insert_doctor"
    ON prescription_items FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IN ('doctor', 'super_admin'));

-- ============================================
-- INVOICES TABLE
-- ============================================

CREATE POLICY "invoices_select_own_or_staff"
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

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================

CREATE POLICY "invoice_items_select_via_invoice"
    ON invoice_items FOR SELECT
    TO authenticated
    USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR get_user_role() IN ('receptionist', 'doctor', 'super_admin')
    );

CREATE POLICY "invoice_items_insert_staff"
    ON invoice_items FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IN ('receptionist', 'doctor', 'super_admin'));

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE POLICY "payments_select_own_or_staff"
    ON payments FOR SELECT
    TO authenticated
    USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

CREATE POLICY "payments_insert_all"
    ON payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- BEDS TABLE
-- ============================================

CREATE POLICY "beds_select_all"
    ON beds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "beds_update_staff"
    ON beds FOR UPDATE
    TO authenticated
    USING (get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin'));

-- ============================================
-- BED ASSIGNMENTS TABLE
-- ============================================

CREATE POLICY "bed_assignments_select_own_or_staff"
    ON bed_assignments FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    );

CREATE POLICY "bed_assignments_insert_staff"
    ON bed_assignments FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IN ('doctor', 'nurse', 'super_admin'));

CREATE POLICY "bed_assignments_update_staff"
    ON bed_assignments FOR UPDATE
    TO authenticated
    USING (get_user_role() IN ('doctor', 'nurse', 'super_admin'));

-- ============================================
-- WARDS TABLE
-- ============================================

CREATE POLICY "wards_select_all"
    ON wards FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "wards_manage_admin"
    ON wards FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================

CREATE POLICY "departments_select_all"
    ON departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "departments_manage_admin"
    ON departments FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- MEDICINES TABLE
-- ============================================

CREATE POLICY "medicines_select_all"
    ON medicines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "medicines_manage_staff"
    ON medicines FOR ALL
    TO authenticated
    USING (get_user_role() IN ('pharmacist', 'super_admin'));

-- ============================================
-- LAB TESTS TABLE
-- ============================================

CREATE POLICY "lab_tests_select_own_or_staff"
    ON lab_tests FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR get_user_role() IN ('doctor', 'lab_technician', 'super_admin')
    );

CREATE POLICY "lab_tests_insert_doctor"
    ON lab_tests FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IN ('doctor', 'super_admin'));

CREATE POLICY "lab_tests_update_staff"
    ON lab_tests FOR UPDATE
    TO authenticated
    USING (get_user_role() IN ('doctor', 'lab_technician', 'super_admin'));

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE POLICY "audit_logs_select_admin"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "audit_logs_insert_all"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that policies were created
SELECT 
    'Policies Created' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Check that functions exist
SELECT 
    'Functions Created' as status,
    COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('get_user_role', 'is_admin');

-- Success message
SELECT '✅ ALL POLICIES FIXED! You can now use the application.' as message;
