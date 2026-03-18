-- ============================================
-- CREATE DEFAULT HOSPITAL DEPARTMENTS
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert default departments
INSERT INTO departments (name, description, is_active) VALUES
('Emergency', 'Emergency and trauma care services', true),
('Cardiology', 'Heart and cardiovascular care', true),
('Neurology', 'Brain and nervous system care', true),
('Orthopedics', 'Bone, joint, and muscle care', true),
('Pediatrics', 'Children and adolescent care', true),
('Obstetrics & Gynecology', 'Women''s health and maternity care', true),
('General Surgery', 'Surgical procedures and operations', true),
('Internal Medicine', 'General adult medicine', true),
('Radiology', 'Medical imaging and diagnostics', true),
('Laboratory', 'Medical testing and analysis', true),
('Pharmacy', 'Medication dispensing and management', true),
('Nursing', 'Patient care and support services', true),
('Administration', 'Hospital management and operations', true),
('Reception', 'Patient registration and front desk', true)
ON CONFLICT DO NOTHING;

-- Verify departments created
SELECT 
    '✅ Departments Created!' as status,
    COUNT(*) as total_departments
FROM departments;

SELECT 
    name,
    description,
    is_active
FROM departments
ORDER BY name;
