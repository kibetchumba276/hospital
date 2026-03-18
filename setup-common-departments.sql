-- ============================================
-- SETUP COMMON HOSPITAL DEPARTMENTS/SERVICES
-- Run this in Supabase SQL Editor
-- ============================================

-- Add a flag to identify emergency department
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;

-- First, deactivate all existing departments
UPDATE departments SET is_active = false;

-- Delete existing departments to start fresh (optional - comment out if you want to keep existing)
-- DELETE FROM departments;

-- Insert common departments (will create new ones)
DO $$
BEGIN
  -- Emergency
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Emergency') THEN
    INSERT INTO departments (name, description, is_active, is_emergency)
    VALUES ('Emergency', 'Emergency medical services - handled by all available staff', true, true);
  ELSE
    UPDATE departments 
    SET description = 'Emergency medical services - handled by all available staff',
        is_active = true,
        is_emergency = true
    WHERE name = 'Emergency';
  END IF;

  -- General Medicine
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Medicine') THEN
    INSERT INTO departments (name, description, is_active, is_emergency)
    VALUES ('General Medicine', 'Common diseases and general health consultations', true, false);
  ELSE
    UPDATE departments 
    SET description = 'Common diseases and general health consultations',
        is_active = true,
        is_emergency = false
    WHERE name = 'General Medicine';
  END IF;

  -- Dental
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Dental') THEN
    INSERT INTO departments (name, description, is_active, is_emergency)
    VALUES ('Dental', 'Dental care and oral health services', true, false);
  ELSE
    UPDATE departments 
    SET description = 'Dental care and oral health services',
        is_active = true,
        is_emergency = false
    WHERE name = 'Dental';
  END IF;

  -- Pediatrics
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Pediatrics') THEN
    INSERT INTO departments (name, description, is_active, is_emergency)
    VALUES ('Pediatrics', 'Child healthcare and pediatric services', true, false);
  ELSE
    UPDATE departments 
    SET description = 'Child healthcare and pediatric services',
        is_active = true,
        is_emergency = false
    WHERE name = 'Pediatrics';
  END IF;

  -- Maternity
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Maternity') THEN
    INSERT INTO departments (name, description, is_active, is_emergency)
    VALUES ('Maternity', 'Maternal and prenatal care services', true, false);
  ELSE
    UPDATE departments 
    SET description = 'Maternal and prenatal care services',
        is_active = true,
        is_emergency = false
    WHERE name = 'Maternity';
  END IF;
END $$;

SELECT '✅ Common departments created!' as status;

-- Show the departments
SELECT 
  name,
  description,
  is_emergency,
  is_active
FROM departments
WHERE is_active = true
ORDER BY 
  CASE 
    WHEN is_emergency THEN 0 
    ELSE 1 
  END,
  name;

SELECT '📋 Active departments listed above' as info;
