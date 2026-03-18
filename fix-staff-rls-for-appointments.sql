-- Fix RLS policies for staff table to allow appointment booking

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view staff" ON staff;
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Anyone can view staff for appointments" ON staff;

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

SELECT '✅ Staff RLS policies fixed for appointment booking!' as status;
