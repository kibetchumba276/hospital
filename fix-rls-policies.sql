-- ============================================
-- FIX RLS POLICIES FOR USER REGISTRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can create own patient record" ON patients;

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Allow users to create their own patient record during registration
CREATE POLICY "Users can create own patient record"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'patients')
ORDER BY tablename, policyname;
