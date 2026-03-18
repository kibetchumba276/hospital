-- ============================================
-- COMPLETE FIX FOR APPOINTMENT BOOKING RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Fix USERS table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;
DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Anyone can view users for appointments" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow everyone to view basic user info (needed for appointments)
CREATE POLICY "Anyone can view users for appointments"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Policy 3: Only admins can insert users
CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Policy 4: Only admins can delete users
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

SELECT '✅ Step 1: Users RLS policies fixed!' as status;

-- Step 2: Fix STAFF table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view staff" ON staff;
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Anyone can view staff for appointments" ON staff;
DROP POLICY IF EXISTS "Admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Admins can update staff" ON staff;
DROP POLICY IF EXISTS "Admins can delete staff" ON staff;

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow everyone (including patients) to view staff for appointment booking
CREATE POLICY "Anyone can view staff for appointments"
ON staff
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only admins can insert staff
CREATE POLICY "Admins can insert staff"
ON staff
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Policy 3: Only admins can update staff
CREATE POLICY "Admins can update staff"
ON staff
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Policy 4: Only admins can delete staff
CREATE POLICY "Admins can delete staff"
ON staff
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

SELECT '✅ Step 2: Staff RLS policies fixed!' as status;

-- Step 3: Verify the fix
-- ============================================

-- Test query to verify staff and users can be joined
SELECT 
  s.id as staff_id,
  s.user_id,
  u.first_name,
  u.last_name,
  u.role,
  d.name as department
FROM staff s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN departments d ON d.id = s.department_id
LIMIT 5;

SELECT '✅ Step 3: Verification query completed!' as status;
SELECT '🎉 ALL FIXES APPLIED SUCCESSFULLY!' as final_status;
SELECT '📝 Now test appointment booking in the app' as next_step;
