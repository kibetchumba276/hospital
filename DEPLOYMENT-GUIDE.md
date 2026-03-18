# Complete Deployment Guide

## Step-by-Step Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Supabase, Tailwind CSS, and UI components.

### Step 2: Setup Supabase Database

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/sql
   - Or navigate: Dashboard → SQL Editor

2. **Run Database Schema**
   - Click "New Query"
   - Copy ALL contents from `database-schema.sql`
   - Paste into the editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for "Success" message

3. **Apply Security Policies**
   - Create another new query
   - Copy ALL contents from `rls-policies.sql`
   - Paste and run
   - Verify success

### Step 3: Create Admin Account

In Supabase SQL Editor, run this query:

```sql
-- Create admin user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@hospital.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"System","last_name":"Administrator"}',
    false
  ) RETURNING id INTO new_user_id;

  -- Insert into users table
  INSERT INTO users (id, email, role, first_name, last_name, is_active)
  VALUES (new_user_id, 'admin@hospital.com', 'super_admin', 'System', 'Administrator', true);
  
  RAISE NOTICE 'Admin user created successfully with ID: %', new_user_id;
END $$;
```

### Step 4: Create Sample Departments

```sql
-- Insert departments
INSERT INTO departments (name, description, is_active) VALUES
('Cardiology', 'Heart and cardiovascular care', true),
('General Medicine', 'General health consultations and primary care', true),
('Pediatrics', 'Child healthcare and development', true),
('Orthopedics', 'Bone, joint, and muscle care', true),
('Dermatology', 'Skin, hair, and nail care', true),
('Neurology', 'Brain and nervous system care', true);
```

### Step 5: Create Sample Doctor (Optional)

```sql
-- Create a sample doctor account
DO $$
DECLARE
  new_user_id uuid;
  new_staff_id uuid;
  cardiology_dept_id uuid;
BEGIN
  -- Get cardiology department ID
  SELECT id INTO cardiology_dept_id FROM departments WHERE name = 'Cardiology' LIMIT 1;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'doctor@hospital.com',
    crypt('Doctor@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"John","last_name":"Smith"}'
  ) RETURNING id INTO new_user_id;

  -- Create user profile
  INSERT INTO users (id, email, role, first_name, last_name, phone, is_active)
  VALUES (new_user_id, 'doctor@hospital.com', 'doctor', 'John', 'Smith', '+1234567890', true);

  -- Create staff record
  INSERT INTO staff (user_id, department_id, specialization, license_number, consultation_fee, available_from, available_to)
  VALUES (new_user_id, cardiology_dept_id, 'Cardiologist', 'MD12345', 150.00, '09:00:00', '17:00:00')
  RETURNING id INTO new_staff_id;

  RAISE NOTICE 'Doctor created successfully';
END $$;
```

### Step 6: Run Development Server

```bash
npm run dev
```

The application will start at http://localhost:3000

### Step 7: Test the Application

1. **Test Admin Login**
   - Go to http://localhost:3000/login
   - Email: admin@hospital.com
   - Password: Admin@123
   - Should redirect to /admin dashboard

2. **Test Patient Registration**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Should create account and redirect to /patient dashboard

3. **Test Doctor Login** (if you created sample doctor)
   - Email: doctor@hospital.com
   - Password: Doctor@123
   - Should redirect to /doctor dashboard

## Verification Checklist

After setup, verify these work:

- [ ] Admin can login and see dashboard
- [ ] Patient can register new account
- [ ] Patient can login and see dashboard
- [ ] Patient can view appointments page
- [ ] Patient can access booking form
- [ ] Departments are visible in booking form
- [ ] Doctor can login (if created)
- [ ] All pages load without errors
- [ ] No console errors in browser

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution:** Run database-schema.sql again in Supabase SQL Editor

### Issue: Can't create admin user
**Solution:** 
```sql
-- Check if user already exists
SELECT email FROM auth.users WHERE email = 'admin@hospital.com';

-- If exists, delete and recreate
DELETE FROM users WHERE email = 'admin@hospital.com';
DELETE FROM auth.users WHERE email = 'admin@hospital.com';
-- Then run create admin query again
```

### Issue: Login redirects to login page
**Solution:** Check browser console for errors. Verify:
- User exists in auth.users table
- User profile exists in users table
- Role is set correctly

### Issue: Appointments page shows no departments
**Solution:** Run the "Create Sample Departments" SQL query

### Issue: RLS policy errors
**Solution:** Run rls-policies.sql again

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add environment variables:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY

4. **Deploy to Production**
```bash
vercel --prod
```

### Option 2: Netlify

1. Connect your Git repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Enable Supabase RLS on all tables
- [ ] Set up proper CORS policies
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Review and test all RLS policies
- [ ] Set up 2FA for admin accounts
- [ ] Configure proper session timeouts

## Performance Optimization

1. **Enable Next.js Image Optimization**
2. **Configure CDN for static assets**
3. **Enable Supabase connection pooling**
4. **Add database indexes** (already included in schema)
5. **Enable caching where appropriate**

## Monitoring

1. **Supabase Dashboard**
   - Monitor database performance
   - Check API usage
   - Review logs

2. **Vercel Analytics** (if using Vercel)
   - Page load times
   - User analytics

3. **Error Tracking**
   - Consider Sentry or similar service

## Backup Strategy

1. **Database Backups**
   - Supabase provides automatic backups
   - Configure backup retention in Supabase dashboard

2. **Code Backups**
   - Use Git for version control
   - Push to GitHub/GitLab

## Support & Maintenance

### Regular Tasks
- Monitor error logs daily
- Review user feedback
- Update dependencies monthly
- Test backup restoration quarterly
- Security audit annually

### Scaling Considerations
- Supabase can handle thousands of concurrent users
- Consider upgrading Supabase plan as you grow
- Monitor database performance metrics
- Add read replicas if needed

---

## Quick Reference

**Admin Login:** admin@hospital.com / Admin@123
**Doctor Login:** doctor@hospital.com / Doctor@123 (if created)

**Supabase Dashboard:** https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe

**Local Dev:** http://localhost:3000

**Key Files:**
- Database: `database-schema.sql`, `rls-policies.sql`
- Config: `.env.local`, `next.config.js`
- Docs: `README.md`, `SETUP.md`, `api-endpoints.md`

---

**Need Help?** Check the browser console and Supabase logs first!
