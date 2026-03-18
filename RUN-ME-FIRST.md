# 🚀 RUN ME FIRST - Simple Start Guide

## THE COMMAND TO START THE WEBSITE:

```bash
npm run dev
```

Or just double-click: **start.bat**

## BEFORE YOU START - ONE-TIME SETUP (5 minutes)

### Step 1: Install Dependencies (First time only)
```bash
npm install
```

### Step 2: Setup Database in Supabase

1. Go to: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/sql

2. Click "New Query" and paste this ENTIRE script:

```sql
-- Copy EVERYTHING from database-schema.sql file
-- (It's in your project folder)
```

3. Click "Run" ✅

4. Create another "New Query" and paste:

```sql
-- Copy EVERYTHING from rls-policies.sql file
```

5. Click "Run" ✅

6. Create another "New Query" and paste this to create admin:

```sql
DO $$
DECLARE new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'admin@hospital.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ) RETURNING id INTO new_user_id;

  INSERT INTO users (id, email, role, first_name, last_name, is_active)
  VALUES (new_user_id, 'admin@hospital.com', 'super_admin', 'System', 'Administrator', true);
END $$;
```

7. Click "Run" ✅

8. Create another "New Query" for departments:

```sql
INSERT INTO departments (name, description, is_active) VALUES
('Cardiology', 'Heart care', true),
('General Medicine', 'General health', true),
('Pediatrics', 'Child healthcare', true);
```

9. Click "Run" ✅

## NOW START THE WEBSITE:

```bash
npm run dev
```

Or double-click: **start.bat**

## OPEN IN BROWSER:

http://localhost:3000

## TEST IT:

1. Click "Register" - Create a patient account
2. Click "Login" - Login as admin:
   - Email: admin@hospital.com
   - Password: Admin@123

## THAT'S IT! 🎉

The website is now running with a beautiful green theme!
