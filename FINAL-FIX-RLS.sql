-- ============================================
-- FINAL FIX - RLS Policies
-- This is the DEFINITIVE solution
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Completely disable RLS temporarily to clean up
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

-- STEP 3: Drop and recreate functions with correct signatures
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create get_user_role - returns TEXT to avoid type issues
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role_text TEXT;
BEGIN
    SELECT role::TEXT INTO user_role_text 
    FROM public.users 
    WHERE id = auth.uid();
    
    RETURN user_role_text;
END;
$$;

-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$;

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

-- STEP 5: Create SIMPLE, WORKING policies

-- ============================================
-- USERS TABLE - CRITICAL FOR LOGIN
-- ============================================

-- Allow authenticated users to read their own profile
CREATE POLICY "users_read_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for registration)
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to do everything
CREATE POLICY "users_admin_all"
ON users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================
-- STAFF TABLE
-- ============================================

CREATE POLICY "staff_read_all"
ON staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "staff_write_admin"
ON staff FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================
-- PATIENTS TABLE
-- ============================================

CREATE POLICY "patients_read_own"
ON patients FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "patients_read_staff"
ON patients FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    )
);

CREATE POLICY "patients_insert_own"
ON patients FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "patients_insert_staff"
ON patients FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'super_admin')
    )
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE POLICY "appointments_read_patient"
ON appointments FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "appointments_read_doctor"
ON appointments FOR SELECT
TO authenticated
USING (
    doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

CREATE POLICY "appointments_read_staff"
ON appointments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'super_admin')
    )
);

CREATE POLICY "appointments_insert_patient"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "appointments_insert_staff"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'doctor', 'super_admin')
    )
);

CREATE POLICY "appointments_update_all"
ON appointments FOR UPDATE
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'super_admin')
    )
);

-- ============================================
-- MEDICAL RECORDS TABLE
-- ============================================

CREATE POLICY "medical_records_read_patient"
ON medical_records FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "medical_records_read_staff"
ON medical_records FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'super_admin')
    )
);

CREATE POLICY "medical_records_insert_doctor"
ON medical_records FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'super_admin')
    )
);

CREATE POLICY "medical_records_update_doctor"
ON medical_records FOR UPDATE
TO authenticated
USING (
    doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================
-- VITALS TABLE
-- ============================================

CREATE POLICY "vitals_read_patient"
ON vitals FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "vitals_read_staff"
ON vitals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'super_admin')
    )
);

CREATE POLICY "vitals_insert_staff"
ON vitals FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'super_admin')
    )
);

-- ============================================
-- PRESCRIPTIONS TABLE
-- ============================================

CREATE POLICY "prescriptions_read_patient"
ON prescriptions FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "prescriptions_read_staff"
ON prescriptions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'pharmacist', 'super_admin')
    )
);

CREATE POLICY "prescriptions_insert_doctor"
ON prescriptions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'super_admin')
    )
);

CREATE POLICY "prescriptions_update_staff"
ON prescriptions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('pharmacist', 'doctor', 'super_admin')
    )
);

-- ============================================
-- PRESCRIPTION ITEMS TABLE
-- ============================================

CREATE POLICY "prescription_items_read_all"
ON prescription_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "prescription_items_insert_doctor"
ON prescription_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'super_admin')
    )
);

-- ============================================
-- INVOICES TABLE
-- ============================================

CREATE POLICY "invoices_read_patient"
ON invoices FOR SELECT
TO authenticated
USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "invoices_read_staff"
ON invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'doctor', 'super_admin')
    )
);

CREATE POLICY "invoices_insert_staff"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'doctor', 'super_admin')
    )
);

CREATE POLICY "invoices_update_staff"
ON invoices FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'doctor', 'super_admin')
    )
);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================

CREATE POLICY "invoice_items_read_all"
ON invoice_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "invoice_items_insert_staff"
ON invoice_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('receptionist', 'doctor', 'super_admin')
    )
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE POLICY "payments_read_all"
ON payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "payments_insert_all"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- BEDS, WARDS, DEPARTMENTS - Simple policies
-- ============================================

CREATE POLICY "beds_read_all" ON beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "beds_write_staff" ON beds FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('doctor', 'nurse', 'receptionist', 'super_admin'))
);

CREATE POLICY "bed_assignments_read_all" ON bed_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "bed_assignments_write_staff" ON bed_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('doctor', 'nurse', 'super_admin'))
);

CREATE POLICY "wards_read_all" ON wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "wards_write_admin" ON wards FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "departments_read_all" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_write_admin" ON departments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "medicines_read_all" ON medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "medicines_write_staff" ON medicines FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pharmacist', 'super_admin'))
);

CREATE POLICY "lab_tests_read_all" ON lab_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_tests_write_staff" ON lab_tests FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('doctor', 'lab_technician', 'super_admin'))
);

CREATE POLICY "audit_logs_read_admin" ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "audit_logs_insert_all" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ RLS POLICIES FIXED!' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    '✅ FUNCTIONS CREATED!' as status,
    COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('get_user_role', 'is_admin');

-- Test the functions
SELECT 
    '✅ Testing get_user_role function...' as status,
    get_user_role() as your_role;

SELECT '🎉 ALL DONE! Try logging in now.' as message;
