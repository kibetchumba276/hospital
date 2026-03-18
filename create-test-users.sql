-- ============================================
-- CREATE TEST USERS MANUALLY
-- Use this to bypass email rate limits
-- ============================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" for each user below
-- 3. Copy the User ID that gets generated
-- 4. Replace 'USER_ID_HERE' with the actual UUID
-- 5. Run the corresponding SQL below

-- ============================================
-- ADMIN USER
-- ============================================
-- Dashboard: Create user with:
-- Email: admin@test.com
-- Password: Admin123!
-- Auto Confirm: YES

-- Then run this (replace USER_ID_HERE):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID_HERE'::uuid,
  'admin@test.com',
  'super_admin',
  'Admin',
  'Test',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', is_active = true;

-- Verify
SELECT id, email, role FROM users WHERE email = 'admin@test.com';

-- ============================================
-- TEST PATIENT
-- ============================================
-- Dashboard: Create user with:
-- Email: patient@test.com
-- Password: Patient123!
-- Auto Confirm: YES

-- Then run this (replace USER_ID_HERE):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID_HERE'::uuid,
  'patient@test.com',
  'patient',
  'Test',
  'Patient',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'patient', is_active = true;

INSERT INTO patients (user_id)
VALUES ('USER_ID_HERE'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.id, u.email, u.role, p.id as patient_id
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
WHERE u.email = 'patient@test.com';

-- ============================================
-- TEST DOCTOR (DENTIST)
-- ============================================
-- Dashboard: Create user with:
-- Email: dentist@test.com
-- Password: Doctor123!
-- Auto Confirm: YES

-- Then run this (replace USER_ID_HERE):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID_HERE'::uuid,
  'dentist@test.com',
  'doctor',
  'Dr. John',
  'Smith',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'doctor', is_active = true;

INSERT INTO staff (user_id, staff_number, specialization, license_number, consultation_fee)
VALUES (
  'USER_ID_HERE'::uuid,
  'DOC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  'Dentist',
  'LIC' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
  50.00
)
ON CONFLICT (user_id) DO UPDATE
SET specialization = 'Dentist', consultation_fee = 50.00;

-- Verify
SELECT u.id, u.email, u.role, s.staff_number, s.specialization
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'dentist@test.com';

-- ============================================
-- TEST DOCTOR (CARDIOLOGIST)
-- ============================================
-- Dashboard: Create user with:
-- Email: cardio@test.com
-- Password: Doctor123!
-- Auto Confirm: YES

-- Then run this (replace USER_ID_HERE):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID_HERE'::uuid,
  'cardio@test.com',
  'doctor',
  'Dr. Sarah',
  'Johnson',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'doctor', is_active = true;

INSERT INTO staff (user_id, staff_number, specialization, license_number, consultation_fee)
VALUES (
  'USER_ID_HERE'::uuid,
  'DOC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  'Cardiologist',
  'LIC' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
  100.00
)
ON CONFLICT (user_id) DO UPDATE
SET specialization = 'Cardiologist', consultation_fee = 100.00;

-- Verify
SELECT u.id, u.email, u.role, s.staff_number, s.specialization
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'cardio@test.com';

-- ============================================
-- CREATE SAMPLE BEDS (for admission testing)
-- ============================================

-- Create a ward first
INSERT INTO wards (name, floor_number, total_beds, is_active)
VALUES ('General Ward', 1, 10, true)
ON CONFLICT DO NOTHING;

-- Get the ward ID
DO $$
DECLARE
  ward_id_var UUID;
BEGIN
  SELECT id INTO ward_id_var FROM wards WHERE name = 'General Ward' LIMIT 1;
  
  -- Create beds
  INSERT INTO beds (ward_id, bed_number, bed_type, status, daily_rate)
  VALUES 
    (ward_id_var, 'B101', 'Standard', 'available', 100.00),
    (ward_id_var, 'B102', 'Standard', 'available', 100.00),
    (ward_id_var, 'B103', 'Standard', 'available', 100.00),
    (ward_id_var, 'B104', 'Private', 'available', 200.00),
    (ward_id_var, 'B105', 'Private', 'available', 200.00)
  ON CONFLICT DO NOTHING;
END $$;

-- Verify beds
SELECT w.name as ward_name, b.bed_number, b.bed_type, b.status, b.daily_rate
FROM beds b
JOIN wards w ON w.id = b.ward_id
ORDER BY b.bed_number;

-- ============================================
-- SUMMARY OF TEST ACCOUNTS
-- ============================================

-- Run this to see all test accounts:
SELECT 
  u.email,
  u.role,
  u.first_name,
  u.last_name,
  CASE 
    WHEN u.role = 'patient' THEN p.id::text
    WHEN u.role = 'doctor' THEN s.staff_number
    ELSE 'N/A'
  END as identifier
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('admin@test.com', 'patient@test.com', 'dentist@test.com', 'cardio@test.com')
ORDER BY u.role, u.email;

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================

/*
ADMIN:
Email: admin@test.com
Password: Admin123!
URL: http://localhost:3000/login

PATIENT:
Email: patient@test.com
Password: Patient123!
URL: http://localhost:3000/login

DENTIST:
Email: dentist@test.com
Password: Doctor123!
URL: http://localhost:3000/login

CARDIOLOGIST:
Email: cardio@test.com
Password: Doctor123!
URL: http://localhost:3000/login
*/
