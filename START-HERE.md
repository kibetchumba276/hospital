# 🎯 START HERE - Hospital Management System

Welcome! This is your complete guide to getting started with the Hospital Management System.

## 🚨 Quick Fix for Current Issues

### Issue 1: "Failed to fetch" on Login
**Most likely your Supabase project is paused!**

1. Go to https://supabase.com/dashboard
2. Find project: `mzxubcgsidqaoodwclwe`
3. Click "Resume" or "Restore" if paused
4. Wait 1-2 minutes
5. Try again

### Issue 2: "Email rate limit reached"
**You've tried signing up too many times!**

**Solution**: Create users manually instead:
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

## 📚 Documentation Guide

### For First-Time Setup
1. **[COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md)** ⭐ START HERE
   - Complete step-by-step setup
   - Database configuration
   - Admin user creation
   - Testing instructions

2. **[create-test-users.sql](create-test-users.sql)** ⭐ IMPORTANT
   - Bypass email rate limits
   - Create admin, patient, and doctor accounts
   - Create sample beds

3. **[verify-setup.sql](verify-setup.sql)** ⭐ VERIFY
   - Check if everything is configured
   - Identify missing components
   - Get recommendations

### For Troubleshooting
1. **[TROUBLESHOOTING-ERRORS.md](TROUBLESHOOTING-ERRORS.md)** ⭐ FIX ISSUES
   - "Failed to fetch" solutions
   - "Email rate limit" solutions
   - All common errors and fixes

2. **[AUTH-FIX-GUIDE.md](AUTH-FIX-GUIDE.md)**
   - Authentication issues
   - Session problems
   - Redirect loops

### For Understanding the System
1. **[README.md](README.md)** - Project overview
2. **[WHAT-WE-BUILT.md](WHAT-WE-BUILT.md)** - Feature list
3. **[CURRENT-STATUS.md](CURRENT-STATUS.md)** - Implementation status

### For Deployment
1. **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Pre-deployment checklist
2. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment instructions

## 🎯 Quick Start (5 Minutes)

### Step 1: Check Supabase Status (1 min)
```
1. Go to https://supabase.com/dashboard
2. Find your project
3. If paused, click "Resume"
4. Wait for it to start
```

### Step 2: Setup Database (2 min)
```
1. Go to Supabase > SQL Editor
2. Run: database-schema-safe.sql
3. Run: rls-policies.sql
4. Run: verify-setup.sql (to check)
```

### Step 3: Create Users (2 min)
```
Follow instructions in create-test-users.sql to create:
- Admin (admin@test.com)
- Patient (patient@test.com)
- Doctor (dentist@test.com)
```

### Step 4: Test (1 min)
```
1. npm run dev
2. Login at http://localhost:3000/login
3. Test with created accounts
```

## 🔍 Verify Your Setup

Run this in Supabase SQL Editor:
```sql
-- Quick verification
SELECT 
    'Tables' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
    'Admin User' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM users WHERE role = 'super_admin') 
    THEN '✅ PASS' ELSE '❌ FAIL' END as status;

SELECT 
    'RLS Policies' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_policies WHERE schemaname = 'public';
```

## 🎮 Test the Complete System

### Test Workflow
1. **Admin creates doctor**
   - Login: admin@test.com
   - Go to /admin/doctors
   - Create dentist account

2. **Patient registers**
   - Go to /register
   - Or use patient@test.com

3. **Patient books appointment**
   - Login: patient@test.com
   - Go to /patient/appointments/book
   - Select "Dentist"
   - Book appointment

4. **Doctor diagnoses**
   - Login: dentist@test.com
   - Go to /doctor/patients
   - Search patient
   - Click "Diagnose"

5. **Doctor bills**
   - Click "Bill"
   - Add items
   - Create invoice

6. **Patient pays**
   - Login: patient@test.com
   - Go to /patient/billing
   - Click "Pay Now"
   - Download receipt

## 📁 Important Files

### SQL Scripts
- `database-schema-safe.sql` - Create all tables
- `rls-policies.sql` - Security policies
- `create-test-users.sql` - Create test accounts
- `verify-setup.sql` - Verify configuration
- `setup-admin.sql` - Create admin user

### Documentation
- `COMPLETE-SETUP-GUIDE.md` - Full setup guide
- `TROUBLESHOOTING-ERRORS.md` - Fix common issues
- `README.md` - Project overview
- `WHAT-WE-BUILT.md` - Feature list

### Configuration
- `.env.local` - Environment variables (already set)
- `next.config.js` - Next.js configuration
- `netlify.toml` - Netlify deployment config

## 🆘 Getting Help

### Common Issues

| Issue | Solution |
|-------|----------|
| Failed to fetch | Resume Supabase project |
| Email rate limit | Create users manually |
| Can't login | Check if user exists in database |
| Redirect loop | Clear browser cache |
| No tables | Run database-schema-safe.sql |
| Permission denied | Run rls-policies.sql |

### Where to Look

1. **Browser Console** (F12) - Client-side errors
2. **Supabase Logs** - Database errors
3. **Network Tab** (F12) - API errors
4. **verify-setup.sql** - Configuration check

### Documentation

- **Setup**: COMPLETE-SETUP-GUIDE.md
- **Errors**: TROUBLESHOOTING-ERRORS.md
- **Features**: WHAT-WE-BUILT.md
- **Testing**: create-test-users.sql

## ✅ Success Checklist

- [ ] Supabase project is active (not paused)
- [ ] Database tables created (run verify-setup.sql)
- [ ] RLS policies applied
- [ ] Admin user created
- [ ] Can login successfully
- [ ] Can create doctor accounts
- [ ] Can register patients
- [ ] Can book appointments
- [ ] Can create invoices
- [ ] Can pay bills

## 🎉 You're Ready!

Once all checks pass:
1. Login as admin
2. Create doctor accounts
3. Register patients
4. Start using the system!

## 📞 Support

- Check TROUBLESHOOTING-ERRORS.md first
- Run verify-setup.sql to diagnose issues
- Check Supabase Dashboard > Logs
- Check browser console for errors

---

**Quick Links**:
- 🏥 [Local App](http://localhost:3000)
- 🗄️ [Supabase Dashboard](https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe)
- 📚 [Complete Setup Guide](COMPLETE-SETUP-GUIDE.md)
- 🔧 [Troubleshooting](TROUBLESHOOTING-ERRORS.md)

**Default Test Accounts** (after setup):
- Admin: admin@test.com / Admin123!
- Patient: patient@test.com / Patient123!
- Doctor: dentist@test.com / Doctor123!
