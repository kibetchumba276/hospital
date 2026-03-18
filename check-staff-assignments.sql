-- Check current staff assignments
-- Run this in Supabase SQL Editor to see the current state

-- 1. Check departments
SELECT 
  id, 
  name, 
  is_emergency,
  is_active,
  created_at
FROM departments 
WHERE is_active = true
ORDER BY name;

-- 2. Check staff without department assignments
SELECT 
  s.id as staff_id,
  u.first_name,
  u.last_name,
  u.role,
  s.department_id,
  d.name as department_name,
  CASE 
    WHEN s.department_id IS NULL THEN '❌ NO DEPARTMENT'
    ELSE '✅ ASSIGNED'
  END as assignment_status
FROM staff s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN departments d ON d.id = s.department_id
ORDER BY u.role, u.first_name;

-- 3. Count staff by department
SELECT 
  d.name as department_name,
  COUNT(s.id) as staff_count,
  STRING_AGG(u.role, ', ') as roles
FROM departments d
LEFT JOIN staff s ON s.department_id = d.id
LEFT JOIN users u ON u.id = s.user_id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY staff_count DESC, d.name;

-- 4. Show unassigned staff count by role
SELECT 
  u.role,
  COUNT(*) as unassigned_count
FROM staff s
JOIN users u ON u.id = s.user_id
WHERE s.department_id IS NULL
GROUP BY u.role
ORDER BY unassigned_count DESC;

SELECT '🔍 Staff assignment check complete!' as status;