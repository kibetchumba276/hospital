-- ============================================
-- FRESH INSTALL - Complete Database Setup
-- Run this for a clean installation
-- ============================================

-- This script will:
-- 1. Create all tables (if they don't exist)
-- 2. Create all functions
-- 3. Create all RLS policies
-- 4. Handle existing objects gracefully

-- ============================================
-- STEP 1: Enable Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Create ENUMs (if they don't exist)
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prescription_status AS ENUM ('pending', 'dispensed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_test_status AS ENUM ('requested', 'sample_collected', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 3: Create Tables (if they don't exist)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_doctor_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_number VARCHAR(20) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id),
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    qualification TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2),
    available_from TIME,
    available_to TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    allergies TEXT[],
    chronic_conditions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES staff(id),
    department_id UUID REFERENCES departments(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    reason_for_visit TEXT,
    notes TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Medical Records
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID NOT NULL REFERENCES staff(id),
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vitals
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID REFERENCES medical_records(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    temperature DECIMAL(4, 1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    height DECIMAL(5, 2),
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID REFERENCES medical_records(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES staff(id),
    status prescription_status DEFAULT 'pending',
    notes TEXT,
    dispensed_by UUID REFERENCES users(id),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity INTEGER,
    instructions TEXT
);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    manufacturer VARCHAR(200),
    category VARCHAR(100),
    unit_price DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Tests
CREATE TABLE IF NOT EXISTS lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES staff(id),
    medical_record_id UUID REFERENCES medical_records(id),
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(100),
    status lab_test_status DEFAULT 'requested',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sample_collected_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    results TEXT,
    notes TEXT,
    technician_id UUID REFERENCES users(id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    due_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES users(id),
    notes TEXT
);

-- Wards
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    floor_number INTEGER,
    total_beds INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Beds
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID NOT NULL REFERENCES wards(id),
    bed_number VARCHAR(20) NOT NULL,
    bed_type VARCHAR(50),
    status bed_status DEFAULT 'available',
    daily_rate DECIMAL(10, 2),
    UNIQUE(ward_id, bed_number)
);

CREATE TABLE IF NOT EXISTS bed_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_id UUID NOT NULL REFERENCES beds(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discharged_at TIMESTAMP WITH TIME ZONE,
    admitted_by UUID REFERENCES users(id),
    notes TEXT
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- STEP 5: Create Functions
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get user role function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 6: Create Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Enable RLS
-- ============================================

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
-- STEP 8: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Super Admin can insert users" ON users;
DROP POLICY IF EXISTS "Super Admin can update users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "Users can create own patient record" ON patients;
DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Medical staff can view patients" ON patients;
DROP POLICY IF EXISTS "Receptionists can insert patients" ON patients;

DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;

DROP POLICY IF EXISTS "Patients can view own medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can view medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can update own medical records" ON medical_records;

DROP POLICY IF EXISTS "Patients can view own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Medical staff can view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Pharmacists can update prescriptions" ON prescriptions;

DROP POLICY IF EXISTS "Patients can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Staff can manage invoices" ON invoices;

DROP POLICY IF EXISTS "Super Admin can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- ============================================
-- STEP 9: Create RLS Policies
-- ============================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

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

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- PATIENTS TABLE POLICIES
CREATE POLICY "Users can create own patient record"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Patients can view own data"
    ON patients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Medical staff can view patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'nurse', 'receptionist', 'super_admin')
    );

CREATE POLICY "Receptionists can insert patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('receptionist', 'super_admin')
    );

-- APPOINTMENTS TABLE POLICIES
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can view their appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

CREATE POLICY "Patients can create appointments"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

CREATE POLICY "Users can update appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR get_user_role() IN ('receptionist', 'super_admin')
    );

-- MEDICAL RECORDS POLICIES
CREATE POLICY "Patients can view own medical records"
    ON medical_records FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can view medical records"
    ON medical_records FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'nurse', 'super_admin')
    );

CREATE POLICY "Doctors can create medical records"
    ON medical_records FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('doctor', 'super_admin')
    );

CREATE POLICY "Doctors can update own medical records"
    ON medical_records FOR UPDATE
    TO authenticated
    USING (
        doctor_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
        OR is_admin()
    );

-- PRESCRIPTIONS POLICIES
CREATE POLICY "Patients can view own prescriptions"
    ON prescriptions FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Medical staff can view prescriptions"
    ON prescriptions FOR SELECT
    TO authenticated
    USING (
        get_user_role() IN ('doctor', 'pharmacist', 'super_admin')
    );

CREATE POLICY "Doctors can create prescriptions"
    ON prescriptions FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role() IN ('doctor', 'super_admin')
    );

CREATE POLICY "Pharmacists can update prescriptions"
    ON prescriptions FOR UPDATE
    TO authenticated
    USING (
        get_user_role() IN ('pharmacist', 'super_admin')
    );

-- INVOICES & PAYMENTS POLICIES
CREATE POLICY "Patients can view own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage invoices"
    ON invoices FOR ALL
    TO authenticated
    USING (
        get_user_role() IN ('receptionist', 'doctor', 'super_admin')
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "Super Admin can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- DONE!
-- ============================================

SELECT 'Installation complete! Run verify-setup.sql to check.' as message;
