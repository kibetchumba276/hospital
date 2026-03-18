-- Fix staff department assignments
-- Run this in Supabase SQL Editor

-- First, let's see what departments we have
SELECT id, name, is_emergency FROM departments WHERE is_active = true;

-- Get all staff without department assignments
SELECT 
  s.id as staff_id,
  u.first_name,
  u.last_name,
  u.role,
  s.department_id,
  d.name as department_name
FROM staff s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN departments d ON d.id = s.department_id
ORDER BY u.role;

-- Assign staff to appropriate departments based on their roles
DO $$
DECLARE
  general_medicine_id UUID;
  dental_id UUID;
  pediatrics_id UUID;
  maternity_id UUID;
  emergency_id UUID;
BEGIN
  -- Get department IDs
  SELECT id INTO general_medicine_id FROM departments WHERE name = 'General Medicine' LIMIT 1;
  SELECT id INTO dental_id FROM departments WHERE name = 'Dental' LIMIT 1;
  SELECT id INTO pediatrics_id FROM departments WHERE name = 'Pediatrics' LIMIT 1;
  SELECT id INTO maternity_id FROM departments WHERE name = 'Maternity' LIMIT 1;
  SELECT id INTO emergency_id FROM departments WHERE name = 'Emergency' LIMIT 1;

  -- Assign doctors to General Medicine (they can handle most cases)
  UPDATE staff 
  SET department_id = general_medicine_id
  WHERE user_id IN (
    SELECT id FROM users WHERE role = 'doctor'
  ) AND department_id IS NULL;

  -- Assign nurses to General Medicine
  UPDATE staff 
  SET department_id = general_medicine_id
  WHERE user_id IN (
    SELECT id FROM users WHERE role = 'nurse'
  ) AND department_id IS NULL;

  -- Assign pharmacists to General Medicine (they serve all departments)
  UPDATE staff 
  SET department_id = general_medicine_id
  WHERE user_id IN (
    SELECT id FROM users WHERE role = 'pharmacist'
  ) AND department_id IS NULL;

  -- Assign lab technicians to General Medicine (they serve all departments)
  UPDATE staff 
  SET department_id = general_medicine_id
  WHERE user_id IN (
    SELECT id FROM users WHERE role = 'lab_technician'
  ) AND department_id IS NULL;

  -- Assign receptionists to General Medicine (they handle general inquiries)
  UPDATE staff 
  SET department_id = general_medicine_id
  WHERE user_id IN (
    SELECT id FROM users WHERE role = 'receptionist'
  ) AND department_id IS NULL;

  RAISE NOTICE 'Staff assignments completed!';
END $$;

-- Verify the assignments
SELECT 
  s.id as staff_id,
  u.first_name,
  u.last_name,
  u.role,
  d.name as department_name
FROM staff s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN departments d ON d.id = s.department_id
ORDER BY d.name, u.role;

SELECT '✅ Staff department assignments fixed!' as status;