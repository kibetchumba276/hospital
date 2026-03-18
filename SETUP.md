# Hospital Management System - Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (already configured)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Your Supabase project is already configured with:
- URL: https://mzxubcgsidqaoodwclwe.supabase.co
- Anon Key: (already in .env.local)

Now you need to run the database schema:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `database-schema.sql` and paste it
5. Click "Run" to execute the schema
6. Then copy the contents of `rls-policies.sql` and run it the same way

### 3. Create Initial Admin User

After running the schema, create your first admin user:

1. In Supabase Dashboard, go to "SQL Editor"
2. Run this query (change the email and password):

```sql
-- Create admin auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hospital.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create admin profile
INSERT INTO users (id, email, role, first_name, last_name, is_active)
SELECT 
  id,
  'admin@hospital.com',
  'super_admin',
  'System',
  'Administrator',
  true
FROM auth.users
WHERE email = 'admin@hospital.com';
```

### 4. Create Sample Data (Optional)

Create a sample department and doctor:

```sql
-- Create Cardiology Department
INSERT INTO departments (name, description, is_active)
VALUES ('Cardiology', 'Heart and cardiovascular care', true);

-- Create General Medicine Department
INSERT INTO departments (name, description, is_active)
VALUES ('General Medicine', 'General health consultations', true);

-- Create Pediatrics Department
INSERT INTO departments (name, description, is_active)
VALUES ('Pediatrics', 'Child healthcare', true);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After setup:
- Email: admin@hospital.com
- Password: admin123

**IMPORTANT:** Change this password immediately after first login!

## User Roles

The system supports these roles:

1. **super_admin** - Full system access
2. **doctor** - Clinical dashboard, patient records, prescriptions
3. **patient** - Book appointments, view records, pay bills
4. **receptionist** - Check-in/out, appointments, billing
5. **nurse** - Patient care, vitals recording
6. **pharmacist** - Prescription management
7. **lab_technician** - Lab test management

## Creating Additional Users

### As Admin (Recommended):
1. Login as admin
2. Go to Admin Dashboard → Users
3. Click "Create User"
4. Fill in the details and select role

### Via SQL (For Testing):
```sql
-- Example: Create a doctor
-- First create auth user, then profile, then staff record
-- See database-schema.sql for table structures
```

## Features Available

✅ Patient self-registration
✅ Login/logout with role-based routing
✅ Patient dashboard with appointments, records, billing
✅ Doctor dashboard with patient queue
✅ Admin dashboard with system stats
✅ Appointment booking with real-time slot availability
✅ Medical records viewing
✅ Billing and invoices
✅ HIPAA-compliant Row Level Security

## Troubleshooting

### "relation does not exist" error
- Make sure you ran both `database-schema.sql` and `rls-policies.sql`
- Check Supabase Dashboard → Database → Tables to verify tables exist

### Can't login
- Verify user exists in Supabase Dashboard → Authentication → Users
- Check that user profile exists in `users` table
- Ensure RLS policies are applied

### Appointments not showing
- Check that departments and doctors exist
- Verify patient record was created during registration
- Check browser console for errors

## Next Steps

1. Customize the green theme in `tailwind.config.ts`
2. Add more departments via Admin panel
3. Create doctor accounts
4. Test patient registration and appointment booking
5. Configure email/SMS notifications (optional)
6. Set up Stripe for payments (optional)

## Production Deployment

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables for Production:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (for admin functions)

## Support

For issues or questions:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for errors
3. Verify database tables and RLS policies
4. Review the API endpoints in `api-endpoints.md`

---

**Security Note:** This system handles sensitive medical data. Before production:
- Change all default passwords
- Enable 2FA for admin accounts
- Set up proper backup procedures
- Conduct security audit
- Ensure HIPAA compliance
- Configure proper SSL/TLS
