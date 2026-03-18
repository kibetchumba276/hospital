-- ============================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- This will fix the "permission denied" errors
-- ============================================

-- First, drop ALL existing policies on users and patients tables
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Super Admin can insert users" ON users;
DROP POLICY IF EXISTS "Super Admin can update users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Medical staff can view patients" ON patients;
DROP POLICY IF EXISTS "Receptionists can insert patients" ON patients;
DROP POLICY IF EXISTS "Users can create own patient record" ON patients;

-- Now create the correct policies

-- USERS TABLE POLICIES
-- Allow users to insert their own profile during registration (CRITICAL!)
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Super Admin can view all users
CREATE POLICY "Super Admin can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin can insert users
CREATE POLICY "Super Admin can insert users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin can update users
CREATE POLICY "Super Admin can update users"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- PATIENTS TABLE POLICIES
-- Allow users to create their own patient record during registration (CRITICAL!)
CREATE POLICY "Users can create own patient record"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Patients can view their own data
CREATE POLICY "Patients can view own data"
    ON patients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Medical staff can view patient data
CREATE POLICY "Medical staff can view patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('doctor', 'nurse', 'receptionist', 'super_admin')
        )
    );

-- Receptionists can insert patients
CREATE POLICY "Receptionists can insert patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('receptionist', 'super_admin')
        )
    );

-- Verify the policies were created successfully
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{authenticated}' THEN 'authenticated users'
        ELSE roles::text 
    END as applies_to
FROM pg_policies 
WHERE tablename IN ('users', 'patients')
ORDER BY tablename, policyname;
