# Fix Staff Login Issues - Quick Guide

## Issues Fixed

1. ✅ Login redirect loop for staff users
2. ✅ Better error handling in all layouts
3. ✅ Patient dashboard now handles non-patient users gracefully
4. 🔧 RLS policies for patients table (needs to be run in Supabase)

## What Was Changed

### 1. Layout Files (app/admin, app/doctor, app/patient)
- Added proper error handling for user data fetching
- Now checks if userData exists before proceeding
- Prevents redirect loops when user data fails to load

### 2. Patient Dashboard (app/patient/page.tsx)
- Changed `.single()` to `.maybeSingle()` for patient lookup
- Now gracefully handles users without patient records (like doctors/nurses)
- No more 406 errors when staff view patient dashboard

### 3. RLS Policies Fix
- Created `fix-patients-rls.sql` to fix the 406 errors

## Steps to Complete the Fix

### Step 1: Run the RLS Fix in Supabase
Go to your Supabase SQL Editor and run:
```sql
-- Copy and paste the contents of fix-patients-rls.sql
```

This will:
- Fix the patients table RLS policies
- Allow staff to view all patients
- Allow patients to view only their own record
- Prevent 406 errors

### Step 2: Test the Login Flow

1. **Create a test doctor account:**
   - Go to Admin → Add User
   - Create a doctor with email: `doctor@test.com`
   - Default password: `123456`

2. **Log in as the doctor:**
   - Use email: `doctor@test.com`
   - Password: `123456`
   - You should see the password change dialog
   - Change the password
   - You should be redirected to the doctor dashboard

3. **Verify no errors:**
   - Check browser console (F12)
   - Should see no 406 errors
   - Should see no redirect loops

### Step 3: Verify All Roles Work

Test login for each role:
- ✅ Super Admin
- ✅ Doctor
- ✅ Nurse
- ✅ Receptionist
- ✅ Patient

## Common Issues & Solutions

### Issue: Still getting 406 errors
**Solution:** Make sure you ran `fix-patients-rls.sql` in Supabase

### Issue: User redirected back to login
**Solution:** Check browser console for errors. Likely a profile issue.

### Issue: Password change modal doesn't appear
**Solution:** Check if `must_change_password` column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'must_change_password';
```

If not, run: `add-password-change-field.sql`

## Testing Checklist

- [ ] Run `fix-patients-rls.sql` in Supabase
- [ ] Create a test doctor account
- [ ] Log in with default password
- [ ] Password change dialog appears
- [ ] Change password successfully
- [ ] Redirected to doctor dashboard
- [ ] No 406 errors in console
- [ ] No redirect loops
- [ ] Doctor can view appointments
- [ ] Doctor can view patients

## Files Modified

1. `app/admin/layout.tsx` - Better error handling
2. `app/doctor/layout.tsx` - Better error handling
3. `app/patient/layout.tsx` - Better error handling
4. `app/patient/page.tsx` - Handle non-patient users
5. `fix-patients-rls.sql` - Fix RLS policies (NEW)

## Next Steps

After running the SQL fix:
1. Clear browser cache and cookies
2. Test login with a fresh staff account
3. Verify password change flow works
4. Check that dashboards load without errors

---

**Need Help?** Check the browser console (F12) for specific error messages.
