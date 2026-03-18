# Supabase Setup Checklist

Complete these steps in your Supabase dashboard to get the system working.

## ✅ Step 1: Run Database Scripts

Go to **SQL Editor** in Supabase and run these files in order:

1. **database-schema.sql** - Creates all tables
   - Click "New Query"
   - Copy/paste the entire file
   - Click "Run"
   - Should see: "Success. No rows returned"

2. **rls-policies.sql** - Sets up security policies
   - Click "New Query"
   - Copy/paste the entire file
   - Click "Run"
   - Should see: "Success. No rows returned"

3. **fix-rls-policies.sql** - Fixes any policy conflicts
   - Click "New Query"
   - Copy/paste the entire file
   - Click "Run"
   - Should see: "Success. No rows returned"

## ✅ Step 2: Create Admin User

### Method 1: Dashboard (Easiest)

1. Go to **Authentication** > **Users**
2. Click **"Add User"** button
3. Fill in:
   - Email: `sammyseth260@gmail.com`
   - Password: (choose a strong password - remember it!)
   - **Auto Confirm User: ✅ YES** (very important!)
4. Click **"Create User"**
5. **Copy the User ID** (UUID) that appears
6. Go to **SQL Editor** > **New Query**
7. Paste this SQL (replace YOUR_USER_ID):

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'YOUR_USER_ID',  -- Paste the UUID you copied
  'sammyseth260@gmail.com',
  'super_admin',
  'Admin',
  'User',
  true
);
```

8. Click **"Run"**
9. Should see: "Success. 1 rows affected"

### Method 2: Check if User Already Exists

If you already created the user before, just update their role:

```sql
-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'sammyseth260@gmail.com';

-- Then update to admin (use the ID from above)
UPDATE users 
SET role = 'super_admin', is_active = true
WHERE email = 'sammyseth260@gmail.com';
```

## ✅ Step 3: Verify Setup

Run this query in SQL Editor to verify everything:

```sql
-- Check if admin user exists
SELECT u.id, u.email, u.role, u.is_active, au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'sammyseth260@gmail.com';
```

You should see:
- ✅ role = 'super_admin'
- ✅ is_active = true
- ✅ email_confirmed_at = (a timestamp, not null)

## ✅ Step 4: Test the Application

1. **Test Admin Login**
   - Go to your app: http://localhost:3000/login
   - Email: sammyseth260@gmail.com
   - Password: (the one you set)
   - Should redirect to `/admin` dashboard
   - Should NOT redirect back to login

2. **Test Patient Registration**
   - Go to: http://localhost:3000/register
   - Fill in the form with test data
   - Click "Create Account"
   - Should see "Account created successfully!"
   - Should redirect to `/patient` dashboard
   - Should NOT redirect back to login

3. **Test Session Persistence**
   - After logging in, refresh the page
   - Should stay logged in (no redirect)
   - Close browser and reopen
   - Should still be logged in

## 🔧 Troubleshooting

### Problem: "Failed to create profile" during registration

**Solution**: Check RLS policies
```sql
-- Verify the policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can insert own profile';
```

If it doesn't exist, run `rls-policies.sql` again.

### Problem: Admin user can't access admin dashboard

**Solution**: Verify the role
```sql
SELECT id, email, role FROM users WHERE email = 'sammyseth260@gmail.com';
```

If role is not 'super_admin', update it:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'sammyseth260@gmail.com';
```

### Problem: "User already registered" error

**Solution**: The auth user exists but profile doesn't. Get the user ID and create profile:
```sql
-- Get user ID
SELECT id FROM auth.users WHERE email = 'sammyseth260@gmail.com';

-- Create profile (use ID from above)
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('USER_ID_HERE', 'sammyseth260@gmail.com', 'super_admin', 'Admin', 'User', true);
```

### Problem: Still redirecting to login after successful login

**Solution**: 
1. Clear browser cache and localStorage
2. Try in incognito/private window
3. Check browser console for errors
4. Verify environment variables in `.env.local`

## 📝 Notes

- The admin user (sammyseth260@gmail.com) has full access to all features
- You can create additional admin users by repeating Step 2
- Patient users are created automatically through the registration form
- Doctor and staff users should be created by the admin through the admin dashboard

## ✅ Deployment Checklist

Before deploying to production:

1. ✅ All database scripts run successfully
2. ✅ Admin user created and tested
3. ✅ Patient registration tested
4. ✅ Login/logout tested
5. ✅ Session persistence tested
6. ✅ Environment variables set in deployment platform
7. ✅ Supabase project is in production mode (not paused)

## 🎉 You're Done!

If all steps are complete and tests pass, your Hospital Management System is ready to use!

Login at: http://localhost:3000/login (or your deployed URL)
