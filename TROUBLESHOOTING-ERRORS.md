# Troubleshooting Common Errors

## Error 1: "Failed to fetch" on Login

### Possible Causes:
1. Supabase project is paused (free tier auto-pauses after inactivity)
2. Network/CORS issue
3. Invalid credentials
4. Database not set up

### Solutions:

#### Solution 1: Check if Supabase Project is Active
1. Go to https://supabase.com/dashboard
2. Find your project: `mzxubcgsidqaoodwclwe`
3. If it says "Paused", click "Restore" or "Resume"
4. Wait 1-2 minutes for it to start
5. Try logging in again

#### Solution 2: Verify Database is Set Up
1. Go to Supabase Dashboard > SQL Editor
2. Run this to check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
3. If no tables, run `database-schema-safe.sql`

#### Solution 3: Check if Admin User Exists
```sql
-- Check auth user
SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email = 'sammyseth260@gmail.com';

-- Check user profile
SELECT id, email, role FROM users 
WHERE email = 'sammyseth260@gmail.com';
```

If user doesn't exist, create it using the steps in `COMPLETE-SETUP-GUIDE.md`

#### Solution 4: Test Supabase Connection
1. Open browser console (F12)
2. Go to Network tab
3. Try logging in
4. Look for failed requests
5. Check the error message

## Error 2: "Email rate limit reached" on Signup

### Cause:
Supabase free tier limits email signups to prevent spam. You've exceeded the limit.

### Solutions:

#### Solution 1: Wait (Recommended)
- Rate limit resets after 1 hour
- Wait and try again later

#### Solution 2: Use Different Email
- Try with a different email address
- Use a temporary email service for testing

#### Solution 3: Create Users Directly in Supabase Dashboard
Instead of using the signup form:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Fill in:
   - Email: your@email.com
   - Password: Test123!
   - **Auto Confirm User: YES** ✅
4. Click "Create User"
5. Copy the User ID
6. Run in SQL Editor:

```sql
-- For Patient
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'PASTE_USER_ID'::uuid,
  'your@email.com',
  'patient',
  'Test',
  'Patient',
  true
);

INSERT INTO patients (user_id)
VALUES ('PASTE_USER_ID'::uuid);
```

```sql
-- For Doctor (created by admin)
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'PASTE_USER_ID'::uuid,
  'doctor@email.com',
  'doctor',
  'Test',
  'Doctor',
  true
);

INSERT INTO staff (user_id, staff_number, specialization, license_number)
VALUES (
  'PASTE_USER_ID'::uuid,
  'DOC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  'General Practitioner',
  'LIC' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')
);
```

#### Solution 4: Disable Email Confirmation (Development Only)
1. Go to Supabase Dashboard > Authentication > Settings
2. Scroll to "Email Auth"
3. Toggle OFF "Enable email confirmations"
4. Save
5. Try signup again

**WARNING**: Only do this in development! Re-enable for production.

#### Solution 5: Upgrade Supabase Plan
- Free tier has rate limits
- Pro plan ($25/month) has higher limits
- Go to Supabase Dashboard > Settings > Billing

## Error 3: "Session not found" or Redirect Loop

### Solution:
1. Clear browser cache and localStorage:
   - Open browser console (F12)
   - Go to Application tab
   - Click "Clear storage"
   - Refresh page

2. Try in incognito/private window

3. Check if session persistence is working:
```javascript
// In browser console
console.log(localStorage.getItem('medicare-auth'))
```

## Error 4: "RLS Policy Violation" or "Permission Denied"

### Solution:
Run the RLS policies:

```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

If no policies, run `rls-policies.sql` in SQL Editor.

## Error 5: "Invalid API Key" or "401 Unauthorized"

### Solution:
1. Verify environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://mzxubcgsidqaoodwclwe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Get fresh keys from Supabase Dashboard > Settings > API
3. Update `.env.local`
4. Restart dev server: `npm run dev`

## Quick Test Without Signup

To test the system without hitting rate limits:

### 1. Create Admin User Manually
```sql
-- In Supabase Dashboard > Authentication > Users, create user with:
-- Email: admin@test.com
-- Password: Admin123!
-- Auto Confirm: YES

-- Then run (replace USER_ID):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('USER_ID'::uuid, 'admin@test.com', 'super_admin', 'Admin', 'Test', true);
```

### 2. Create Test Patient Manually
```sql
-- In Supabase Dashboard > Authentication > Users, create user with:
-- Email: patient@test.com
-- Password: Patient123!
-- Auto Confirm: YES

-- Then run (replace USER_ID):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('USER_ID'::uuid, 'patient@test.com', 'patient', 'Test', 'Patient', true);

INSERT INTO patients (user_id)
VALUES ('USER_ID'::uuid);
```

### 3. Create Test Doctor Manually
```sql
-- In Supabase Dashboard > Authentication > Users, create user with:
-- Email: doctor@test.com
-- Password: Doctor123!
-- Auto Confirm: YES

-- Then run (replace USER_ID):
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('USER_ID'::uuid, 'doctor@test.com', 'doctor', 'Dr. Test', 'Doctor', true);

INSERT INTO staff (user_id, staff_number, specialization, license_number, consultation_fee)
VALUES (
  'USER_ID'::uuid,
  'DOC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  'Dentist',
  'LIC12345',
  50.00
);
```

## Still Having Issues?

### Check Supabase Logs
1. Go to Supabase Dashboard > Logs
2. Select "Postgres Logs" or "API Logs"
3. Look for errors
4. Share the error message

### Check Browser Console
1. Open browser console (F12)
2. Go to Console tab
3. Try the action that's failing
4. Look for red error messages
5. Share the error

### Verify Network Requests
1. Open browser console (F12)
2. Go to Network tab
3. Try the action
4. Look for failed requests (red)
5. Click on the failed request
6. Check the Response tab
7. Share the error message

## Common Error Messages and Fixes

| Error | Fix |
|-------|-----|
| "Failed to fetch" | Check if Supabase project is active |
| "Email rate limit" | Wait 1 hour or create users manually |
| "Invalid login credentials" | Check password, verify user exists |
| "User not found" | Create user profile in users table |
| "Permission denied" | Run RLS policies |
| "Session expired" | Clear cache and login again |
| "Network error" | Check internet connection |
| "CORS error" | Verify Supabase URL is correct |

## Need More Help?

1. Check if Supabase project is paused
2. Verify database tables exist
3. Confirm admin user is created
4. Test with manually created users
5. Check browser console for errors
6. Check Supabase logs for errors
