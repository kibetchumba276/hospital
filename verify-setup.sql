-- ============================================
-- VERIFY COMPLETE SETUP
-- Run this to check if everything is configured correctly
-- ============================================

-- 1. Check if all tables exist
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ PASS'
        ELSE '❌ FAIL - Run database-schema-safe.sql'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 2. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Check if RLS is enabled
SELECT 
    'RLS Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Check if RLS policies exist
SELECT 
    'RLS Policies' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Run rls-policies.sql'
    END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. List all RLS policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Check if admin user exists
SELECT 
    'Admin User Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users WHERE role = 'super_admin'
        ) THEN '✅ PASS - Admin exists'
        ELSE '❌ FAIL - Create admin user'
    END as status;

-- 7. List all users by role
SELECT 
    role,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM users
GROUP BY role
ORDER BY role;

-- 8. Check if staff_number column exists
SELECT 
    'Staff Number Column' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'staff' AND column_name = 'staff_number'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Run migration-add-staff-number.sql'
    END as status;

-- 9. Check doctors
SELECT 
    'Doctors Check' as check_type,
    COUNT(*) as doctor_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - ' || COUNT(*) || ' doctor(s) exist'
        ELSE '⚠️ WARNING - No doctors yet (create via admin panel)'
    END as status
FROM staff s
JOIN users u ON u.id = s.user_id
WHERE u.role = 'doctor';

-- 10. List all doctors
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    s.staff_number,
    s.specialization,
    s.consultation_fee,
    u.is_active
FROM staff s
JOIN users u ON u.id = s.user_id
WHERE u.role = 'doctor'
ORDER BY s.staff_number;

-- 11. Check patients
SELECT 
    'Patients Check' as check_type,
    COUNT(*) as patient_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - ' || COUNT(*) || ' patient(s) exist'
        ELSE '⚠️ WARNING - No patients yet (register via /register)'
    END as status
FROM patients p
JOIN users u ON u.id = p.user_id
WHERE u.role = 'patient';

-- 12. Check beds
SELECT 
    'Beds Check' as check_type,
    COUNT(*) as bed_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - ' || COUNT(*) || ' bed(s) available'
        ELSE '⚠️ WARNING - No beds (run create-test-users.sql for sample beds)'
    END as status
FROM beds;

-- 13. List available beds
SELECT 
    w.name as ward_name,
    w.floor_number,
    b.bed_number,
    b.bed_type,
    b.status,
    b.daily_rate
FROM beds b
JOIN wards w ON w.id = b.ward_id
WHERE b.status = 'available'
ORDER BY w.name, b.bed_number;

-- 14. Check appointments
SELECT 
    'Appointments Check' as check_type,
    COUNT(*) as appointment_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' appointment(s) exist'
        ELSE '⚠️ No appointments yet'
    END as status
FROM appointments;

-- 15. Check invoices
SELECT 
    'Invoices Check' as check_type,
    COUNT(*) as invoice_count,
    SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid
FROM invoices;

-- 16. Check medical records
SELECT 
    'Medical Records Check' as check_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' record(s) exist'
        ELSE '⚠️ No medical records yet'
    END as status
FROM medical_records;

-- 17. Summary Report
SELECT 
    '=== SETUP SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as admins,
    (SELECT COUNT(*) FROM users WHERE role = 'doctor') as doctors,
    (SELECT COUNT(*) FROM users WHERE role = 'patient') as patients,
    (SELECT COUNT(*) FROM beds WHERE status = 'available') as available_beds,
    (SELECT COUNT(*) FROM appointments) as total_appointments,
    (SELECT COUNT(*) FROM invoices WHERE payment_status = 'pending') as pending_invoices;

-- 18. Check for common issues
SELECT 
    'Common Issues Check' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE role = 'super_admin')
        THEN '❌ No admin user - Create one!'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'staff_number')
        THEN '❌ Missing staff_number column - Run migration!'
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') < 10
        THEN '❌ Missing RLS policies - Run rls-policies.sql!'
        ELSE '✅ No common issues detected'
    END as status;

-- 19. Environment Check
SELECT 
    'Environment Variables' as check_type,
    'Check .env.local file has:' as instruction,
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY' as required_vars;

-- 20. Next Steps
SELECT 
    'Next Steps' as action,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE role = 'super_admin')
        THEN '1. Create admin user (see setup-admin.sql)'
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE role = 'doctor')
        THEN '2. Login as admin and create doctors at /admin/doctors'
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE role = 'patient')
        THEN '3. Register a patient at /register or create manually'
        WHEN NOT EXISTS (SELECT 1 FROM beds)
        THEN '4. Create beds (see create-test-users.sql)'
        ELSE '✅ System ready! Start using the application'
    END as instruction;
