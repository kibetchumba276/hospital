# 🚨 EMERGENCY FIX - Do This Now!

## Your Error: "Failed to fetch user profile"

This means your user exists in Supabase Auth but NOT in the users table.

## Fix in 3 Steps (2 minutes)

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com/dashboard
2. Select your project: `mzxubcgsidqaoodwclwe`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run This SQL
Copy and paste this ENTIRE script:

```sql
-- Fix missing user profiles
INSERT INTO users (id, email, role, first_name, last_name, is_active)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'sammyseth260@gmail.com' THEN 'super_admin'
        ELSE 'patient'
    END as role,
    COALESCE(au.raw_user_meta_data->>'first_name', 'User') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name') as last_name,
    true as is_active
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    is_active = true;

-- Create patient records for patient users
INSERT INTO patients (user_id)
SELECT u.id
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
WHERE u.role = 'patient' AND p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify the fix
SELECT 
    au.email,
    u.role,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ FIXED'
        ELSE '❌ STILL BROKEN'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;
```

### Step 3: Try Logging In Again
1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Sign In"
4. Should work now!

## If Still Not Working

### Check if Supabase is Paused
1. Go to https://supabase.com/dashboard
2. Look for your project
3. If it says "Paused", click "Resume"
4. Wait 1-2 minutes
5. Try again

### Verify the Fix Worked
Run this in SQL Editor:

```sql
SELECT 
    au.email,
    au.id as auth_id,
    u.id as profile_id,
    u.role,
    CASE 
        WHEN u.id IS NULL THEN '❌ NO PROFILE - Run fix again'
        WHEN u.role IS NULL THEN '❌ NO ROLE - Run fix again'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE au.email = 'sammyseth260@gmail.com';
```

Should show:
- ✅ OK
- role = super_admin

## Still Having Issues?

### Option 1: Create User Manually
1. Go to Supabase Dashboard > Authentication > Users
2. Find your user (sammyseth260@gmail.com)
3. Copy the User ID
4. Run in SQL Editor:

```sql
-- Replace USER_ID_HERE with the actual UUID
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'USER_ID_HERE'::uuid,
  'sammyseth260@gmail.com',
  'super_admin',
  'Admin',
  'User',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', is_active = true;
```

### Option 2: Start Fresh
1. Delete the user in Supabase Dashboard > Authentication > Users
2. Create new user:
   - Email: admin@test.com
   - Password: Admin123!
   - Auto Confirm: YES ✅
3. Copy the User ID
4. Run in SQL Editor:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'PASTE_USER_ID'::uuid,
  'admin@test.com',
  'super_admin',
  'Admin',
  'Test',
  true
);
```

5. Login with admin@test.com / Admin123!

## Quick Test

After fixing, test with this SQL:

```sql
-- Should return your user with super_admin role
SELECT * FROM users WHERE email = 'sammyseth260@gmail.com';

-- Should show 1 admin
SELECT COUNT(*) as admin_count FROM users WHERE role = 'super_admin';
```

## What This Fix Does

1. ✅ Creates user profiles for all auth users
2. ✅ Sets sammyseth260@gmail.com as super_admin
3. ✅ Creates patient records for patient users
4. ✅ Fixes the "Failed to fetch user profile" error

## Next Steps After Fix

1. ✅ Login as admin
2. ✅ Go to /admin/doctors
3. ✅ Create doctor accounts
4. ✅ Test the system

---

**Need More Help?**
- Check: TROUBLESHOOTING-ERRORS.md
- Run: FIX-ALL-ERRORS.sql (comprehensive fix)
- Verify: verify-setup.sql (check configuration)
