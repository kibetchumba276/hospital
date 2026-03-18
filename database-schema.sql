-- ============================================
-- HOSPITAL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Backend: Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('super_admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded', 'cancelled');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE prescription_status AS ENUM ('pending', 'dispensed', 'cancelled');
CREATE TYPE lab_test_status AS ENUM ('requested', 'sample_collected', 'in_progress', 'completed', 'cancelled');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
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
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_doctor_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff (Doctors, Nurses, etc.)
CREATE TABLE staff (
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
CREATE TABLE patients (
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

-- ============================================
-- APPOINTMENT SYSTEM
-- ============================================

CREATE TABLE appointments (
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

-- ============================================
-- MEDICAL RECORDS (EMR)
-- ============================================

CREATE TABLE medical_records (
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
CREATE TABLE vitals (
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

-- ============================================
-- PRESCRIPTIONS
-- ============================================

CREATE TABLE prescriptions (
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

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity INTEGER,
    instructions TEXT
);

-- ============================================
-- PHARMACY & INVENTORY
-- ============================================

CREATE TABLE medicines (
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

-- ============================================
-- LAB TESTS
-- ============================================

CREATE TABLE lab_tests (
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

-- ============================================
-- BILLING SYSTEM
-- ============================================

CREATE TABLE invoices (
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

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES users(id),
    notes TEXT
);

-- ============================================
-- BED MANAGEMENT
-- ============================================

CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    floor_number INTEGER,
    total_beds INTEGER,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID NOT NULL REFERENCES wards(id),
    bed_number VARCHAR(20) NOT NULL,
    bed_type VARCHAR(50),
    status bed_status DEFAULT 'available',
    daily_rate DECIMAL(10, 2),
    UNIQUE(ward_id, bed_number)
);

CREATE TABLE bed_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_id UUID NOT NULL REFERENCES beds(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discharged_at TIMESTAMP WITH TIME ZONE,
    admitted_by UUID REFERENCES users(id),
    notes TEXT
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
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
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
