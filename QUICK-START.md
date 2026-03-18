# 🚀 Quick Start Guide - Get Running in 5 Minutes!

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Setup Database (2 minutes)

### A. Run Database Schema

1. Open: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/sql
2. Click "New Query"
3. Copy ALL of `database-schema.sql` and paste
4. Click "Run" ✅

### B. Apply Security Policies

1. Click "New Query" again
2. Copy ALL of `rls-policies.sql` and paste
3. Click "Run" ✅

## Step 3: Create Admin User (1 minute)

In Supabase SQL Editor, run this:

```sql
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@hospital.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ) RETURNING id INTO new_user_id;

  INSERT INTO users (id, email, role, first_name, last_name, is_active)
  VALUES (new_user_id, 'admin@hospital.com', 'super_admin', 'System', 'Administrator', true);
END $$;
```

## Step 4: Add Sample Departments (30 seconds)

```sql
INSERT INTO departments (name, description, is_active) VALUES
('Cardiology', 'Heart and cardiovascular care', true),
('General Medicine', 'General health consultations', true),
('Pediatrics', 'Child healthcare', true);
```

## Step 5: Start the App! (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000

## 🎉 You're Done! Now Test:

### Test 1: Admin Login
- Go to http://localhost:3000/login
- Email: `admin@hospital.com`
- Password: `Admin@123`
- ✅ Should see Admin Dashboard

### Test 2: Patient Registration
- Go to http://localhost:3000/register
- Fill in the form
- ✅ Should create account and see Patient Dashboard

### Test 3: Book Appointment
- As patient, click "Book Appointment"
- Select department and date
- ✅ Should see available time slots

## 🎨 What You Get

✅ Beautiful green-themed hospital website
✅ Patient portal with appointments, records, billing
✅ Doctor dashboard with patient queue
✅ Admin panel with system stats
✅ Secure authentication
✅ Real-time appointment booking
✅ Mobile responsive design

## 🔧 Optional: Create Sample Doctor

```sql
DO $$
DECLARE
  new_user_id uuid;
  dept_id uuid;
BEGIN
  SELECT id INTO dept_id FROM departments WHERE name = 'Cardiology' LIMIT 1;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'doctor@hospital.com',
    crypt('Doctor@123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ) RETURNING id INTO new_user_id;

  INSERT INTO users (id, email, role, first_name, last_name, is_active)
  VALUES (new_user_id, 'doctor@hospital.com', 'doctor', 'John', 'Smith', true);

  INSERT INTO staff (user_id, department_id, specialization, license_number, 
                     consultation_fee, available_from, available_to)
  VALUES (new_user_id, dept_id, 'Cardiologist', 'MD12345', 150.00, '09:00:00', '17:00:00');
END $$;
```

Then login as doctor:
- Email: `doctor@hospital.com`
- Password: `Doctor@123`

## ❓ Troubleshooting

### "relation does not exist"
→ Run `database-schema.sql` again

### Can't login
→ Check Supabase Dashboard → Authentication → Users

### No departments showing
→ Run the departments SQL query

### Page won't load
→ Check browser console for errors

## 📚 Next Steps

1. ✅ Read `PROJECT-SUMMARY.md` for complete overview
2. ✅ Check `DEPLOYMENT-GUIDE.md` for production deployment
3. ✅ Review `api-endpoints.md` for API details
4. ✅ Customize colors in `tailwind.config.ts`

## 🎯 Default Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | doctor@hospital.com | Doctor@123 |
| Patient | (register new) | (your choice) |

**⚠️ Change passwords in production!**

## 🚀 Deploy to Production

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, add environment variables
```

---

**That's it! You now have a fully working Hospital Management System! 🏥**

Need help? Check the other documentation files or the browser console for errors.
