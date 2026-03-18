# Authentication Fix Guide

## Issues Fixed

1. **Redirect Loop** - Users were being redirected back to login after successful authentication
2. **Slow Loading** - Session checks were inefficient and not cached
3. **Registration Failures** - RLS policies and timing issues prevented user creation

## Changes Made

### 1. Supabase Client Configuration (`lib/supabase.ts`)
- Added session persistence with localStorage
- Enabled auto token refresh
- Added custom storage key for better session management

### 2. Layout Authentication (`app/*/layout.tsx`)
- Changed from `getUser()` to `getSession()` for faster, cached checks
- Added `checking` flag to prevent multiple simultaneous auth checks
- Used `router.replace()` instead of `router.push()` to prevent back button issues
- Added proper error handling with try-catch blocks
- Improved loading UI with spinner

### 3. Registration Flow (`app/register/page.tsx`)
- Added 2-second wait after signup for session establishment
- Added session verification before creating profile
- Better error messages with specific failure reasons
- Added success state and visual feedback
- Improved error handling

### 4. Login Flow (`app/login/page.tsx`)
- Added session verification after login
- Added 500ms wait for session establishment
- Sign out user if profile fetch fails
- Better error handling

## Setup Admin User

### Method 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter:
   - Email: `sammyseth260@gmail.com`
   - Password: (choose a secure password)
   - Auto Confirm User: **YES** (important!)
5. Click "Create User"
6. Copy the User ID (UUID)
7. Go to SQL Editor and run:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES (
  'PASTE_USER_ID_HERE',
  'sammyseth260@gmail.com',
  'super_admin',
  'Admin',
  'User',
  true
);
```

### Method 2: Update Existing User
If the user already exists in auth.users:

```sql
-- Find the user
SELECT id, email FROM auth.users WHERE email = 'sammyseth260@gmail.com';

-- Update to admin
UPDATE users 
SET role = 'super_admin', is_active = true
WHERE email = 'sammyseth260@gmail.com';
```

## Testing the Fix

### Test Registration
1. Go to `/register`
2. Fill in the form with test data
3. Submit
4. Should see "Account created successfully! Redirecting..."
5. Should redirect to `/patient` dashboard
6. Should NOT redirect back to login

### Test Login
1. Go to `/login`
2. Enter credentials
3. Submit
4. Should see brief loading state
5. Should redirect to appropriate dashboard based on role
6. Should NOT redirect back to login

### Test Session Persistence
1. Log in successfully
2. Refresh the page
3. Should remain logged in (no redirect to login)
4. Navigate to different pages
5. Should stay authenticated

## Common Issues

### Issue: Still redirecting to login after successful login
**Solution**: Clear browser localStorage and cookies, then try again

### Issue: Registration fails with "Failed to create profile"
**Solution**: Check Supabase logs for RLS policy errors. Ensure RLS policies allow authenticated users to insert their own records.

### Issue: Slow loading on every page
**Solution**: Verify session persistence is working by checking localStorage for 'medicare-auth' key

### Issue: Admin user can't access admin dashboard
**Solution**: Verify the user's role in the database:
```sql
SELECT id, email, role FROM users WHERE email = 'sammyseth260@gmail.com';
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## RLS Policy Check

Verify these policies exist:

```sql
-- Users can insert their own profile
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile';

-- Users can create their own patient record
SELECT * FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can create own patient record';
```

If missing, run `rls-policies.sql` in Supabase SQL Editor.
