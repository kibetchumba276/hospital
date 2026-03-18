# 🚨 RUN THIS NOW - Final Fix

## The Problem
You're seeing "Error fetching user role: object" because the RLS policies have issues with the `get_user_role()` function.

## The Solution
Run **ULTIMATE-FIX.sql** - this will fix everything once and for all.

## Steps to Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com/dashboard
2. Select your project: `mzxubcgsidqaoodwclwe`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run ULTIMATE-FIX.sql
1. Open the file `ULTIMATE-FIX.sql` from your project
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Wait for it to complete (should take 5-10 seconds)

### Step 3: Verify
You should see:
```
✅ ALL POLICIES FIXED! You can now use the application.
```

### Step 4: Test
1. Go to your app: http://localhost:3000/login
2. Try logging in
3. Should work now!

## What This Script Does

1. **Drops all existing policies** (CASCADE to handle dependencies)
2. **Recreates helper functions** with proper return types
3. **Creates simplified RLS policies** that actually work
4. **Enables RLS on all tables**
5. **Verifies everything is set up correctly**

## After Running the Script

### Create Admin User
If you haven't already:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `admin@test.com`
4. Password: `Admin123!`
5. **Auto Confirm User: YES** ✅
6. Copy the User ID
7. Run in SQL Editor:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('PASTE_USER_ID'::uuid, 'admin@test.com', 'super_admin', 'Admin', 'Test', true);
```

### Create Test Patient
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `patient@test.com`
4. Password: `Patient123!`
5. **Auto Confirm User: YES** ✅
6. Copy the User ID
7. Run in SQL Editor:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('PASTE_USER_ID'::uuid, 'patient@test.com', 'patient', 'Test', 'Patient', true);

INSERT INTO patients (user_id) VALUES ('PASTE_USER_ID'::uuid);
```

### Create Test Doctor
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `doctor@test.com`
4. Password: `Doctor123!`
5. **Auto Confirm User: YES** ✅
6. Copy the User ID
7. Run in SQL Editor:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('PASTE_USER_ID'::uuid, 'doctor@test.com', 'doctor', 'Dr. Test', 'Doctor', true);

INSERT INTO staff (user_id, staff_number, specialization, license_number, consultation_fee)
VALUES (
  'PASTE_USER_ID'::uuid,
  'DOC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  'Dentist',
  'LIC12345',
  50.00
);
```

## Test the System

### Test 1: Login as Admin
```
URL: http://localhost:3000/login
Email: admin@test.com
Password: Admin123!
Should redirect to: /admin
```

### Test 2: Login as Patient
```
URL: http://localhost:3000/login
Email: patient@test.com
Password: Patient123!
Should redirect to: /patient
```

### Test 3: Login as Doctor
```
URL: http://localhost:3000/login
Email: doctor@test.com
Password: Doctor123!
Should redirect to: /doctor
```

## Still Having Issues?

### Issue: "Failed to fetch"
**Cause**: Supabase project is paused
**Fix**: 
1. Go to Supabase Dashboard
2. Click "Resume" or "Restore" on your project
3. Wait 1-2 minutes
4. Try again

### Issue: "User not found"
**Cause**: User profile not created in users table
**Fix**: Run the INSERT statements above with the correct User ID

### Issue: "Permission denied"
**Cause**: RLS policies not applied
**Fix**: Run ULTIMATE-FIX.sql again

### Issue: Still seeing errors
**Fix**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear localStorage (F12 > Application > Local Storage > Clear)
3. Try in incognito window
4. Check Supabase logs for errors

## Quick Verification

Run this in Supabase SQL Editor to check everything:

```sql
-- Check tables
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
-- Should be 20+

-- Check policies
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
-- Should be 40+

-- Check functions
SELECT proname FROM pg_proc WHERE proname IN ('get_user_role', 'is_admin');
-- Should show both functions

-- Check users
SELECT email, role FROM users;
-- Should show your test users
```

## Success Checklist

- [ ] Ran ULTIMATE-FIX.sql successfully
- [ ] Created admin user
- [ ] Created test patient
- [ ] Created test doctor
- [ ] Can login as admin
- [ ] Can login as patient
- [ ] Can login as doctor
- [ ] No console errors
- [ ] All features work

## You're Done!

Once all checks pass, your Hospital Management System is fully functional!

---

**Need Help?**
- Check browser console (F12) for errors
- Check Supabase Dashboard > Logs
- Check TROUBLESHOOTING-ERRORS.md
