-- Fix RLS policies for users table to allow appointment booking

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;
DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Anyone can view users for appointments" ON users;

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

SELECT '✅ Users RLS policies fixed for appointment booking!' as status;
