-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- HIPAA/GDPR Compliance
-- ============================================

-- Enable RLS on all tables
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
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Super Admin: Full access
CREATE POLICY "Super Admin can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Super Admin can insert users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Super Admin can update users"
    ON users FOR UPDATE
    TO authenticated
    USING (is_admin());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ============================================
-- PATIENTS TABLE POLICIES
-- ============================================

-- Allow users to create their own patient record during registration
CREATE POLICY "Users can create own patient record"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Patients can view their own data
CREATE POLICY "Patients can view own data"
    ON patients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Medical staff can view patient data
CREATE POLICY "Medical staff can view patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    );

-- Receptionists can insert patients
CREATE POLICY "Receptionists can insert patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('receptionist', 'super_admin')
    );

-- ============================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Doctors can view their appointments
CREATE POLICY "Doctors can view their appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

-- Patients and receptionists can create appointments
CREATE POLICY "Patients can create appointments"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

-- Patients, doctors, and receptionists can update appointments
CREATE POLICY "Users can update appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

-- ============================================
-- MEDICAL RECORDS POLICIES (HIPAA Critical)
-- ============================================

-- Patients can view their own medical records
CREATE POLICY "Patients can view own medical records"
    ON medical_records FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Doctors can view medical records of their patients
CREATE POLICY "Doctors can view medical records"
    ON medical_records FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'nurse', 'super_admin')
    );

-- Only doctors can create medical records
CREATE POLICY "Doctors can create medical records"
    ON medical_records FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('doctor', 'super_admin')
    );

-- Only the creating doctor can update their medical records
CREATE POLICY "Doctors can update own medical records"
    ON medical_records FOR UPDATE
    TO authenticated
    USING (
        doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR is_admin()
    );

-- ============================================
-- PRESCRIPTIONS POLICIES
-- ============================================

-- Patients can view their prescriptions
CREATE POLICY "Patients can view own prescriptions"
    ON prescriptions FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Medical staff can view prescriptions
CREATE POLICY "Medical staff can view prescriptions"
    ON prescriptions FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'pharmacist', 'super_admin')
    );

-- Doctors can create prescriptions
CREATE POLICY "Doctors can create prescriptions"
    ON prescriptions FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('doctor', 'super_admin')
    );

-- Pharmacists can update prescription status
CREATE POLICY "Pharmacists can update prescriptions"
    ON prescriptions FOR UPDATE
    TO authenticated
    USING (
        get_user_role() IN ('pharmacist', 'super_admin')
    );

-- ============================================
-- INVOICES & PAYMENTS POLICIES
-- ============================================

-- Patients can view their invoices
CREATE POLICY "Patients can view own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Receptionists and admins can manage invoices
CREATE POLICY "Staff can manage invoices"
    ON invoices FOR ALL
    TO authenticated
    USING (
        get_user_role() IN ('receptionist', 'super_admin')
    );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only super admin can view audit logs
CREATE POLICY "Super Admin can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
