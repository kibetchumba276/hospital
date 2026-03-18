-- Fix RLS policies for patients table to prevent 406 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own patient record" ON patients;
DROP POLICY IF EXISTS "Staff can view all patients" ON patients;
DROP POLICY IF EXISTS "Admins can manage patients" ON patients;
DROP POLICY IF EXISTS "Patients can view own record" ON patients;
DROP POLICY IF EXISTS "Staff can view patients" ON patients;

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy 1: Patients can view their own record
CREATE POLICY "Patients can view own record"
ON patients
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor', 'nurse', 'receptionist')
  )
);

-- Policy 2: Staff can insert patient records
CREATE POLICY "Staff can insert patients"
ON patients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'receptionist', 'doctor', 'nurse')
  )
);

-- Policy 3: Staff can update patient records
CREATE POLICY "Staff can update patients"
ON patients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'receptionist', 'doctor', 'nurse')
  )
);

-- Policy 4: Only admins can delete
CREATE POLICY "Admins can delete patients"
ON patients
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

SELECT '✅ Patients table RLS policies fixed!' as status;
