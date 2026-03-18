# 🏥 Hospital Management System

A complete Hospital Management System with Next.js 14 and Supabase.

## Features

- Patient registration and login
- Appointment booking with real-time slots
- Medical records management
- Billing and invoices
- Doctor dashboard with patient queue
- Admin dashboard with system stats
- Beautiful green medical theme
- Session persistence and secure authentication
- Role-based access control (Patient, Doctor, Admin)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

Go to your Supabase SQL Editor and run in this order:
1. `database-schema.sql` - Creates all tables
2. `rls-policies.sql` - Sets up security policies
3. `fix-rls-policies.sql` - Fixes any policy issues

### 3. Create Admin User

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `sammyseth260@gmail.com`
4. Password: (choose a secure password)
5. **Auto Confirm User: YES** ✅
6. Click "Create User" and copy the User ID
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

**Option B: Using Node Script**
1. Get your Service Role Key from Supabase Dashboard > Settings > API
2. Edit `create-admin.js` and add your service key
3. Run: `node create-admin.js`

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Default Credentials

After setup:
- **Admin**: sammyseth260@gmail.com / (your chosen password)
- **Test Patient**: Register at `/register`

## Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Authentication Features

✅ Session persistence with localStorage
✅ Auto token refresh
✅ No redirect loops
✅ Fast page loads with cached sessions
✅ Proper error handling
✅ Role-based routing

## Troubleshooting

### Issue: Redirecting to login after successful login
**Solution**: Clear browser cache and localStorage, then try again

### Issue: Registration not working
**Solution**: 
1. Check Supabase logs for errors
2. Verify RLS policies are applied: `SELECT * FROM pg_policies WHERE tablename = 'users';`
3. Run `fix-rls-policies.sql` again

### Issue: Admin can't access admin dashboard
**Solution**: Verify role in database:
```sql
SELECT id, email, role FROM users WHERE email = 'sammyseth260@gmail.com';
```

See `AUTH-FIX-GUIDE.md` for detailed troubleshooting.

## Project Structure

```
app/
├── admin/          # Admin dashboard
├── doctor/         # Doctor dashboard
├── patient/        # Patient portal
├── login/          # Login page
└── register/       # Registration page
lib/
├── supabase.ts     # Supabase client with session config
└── utils.ts        # Utility functions
components/
└── ui/             # Reusable UI components
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) for HIPAA compliance

## Deployment

See `DEPLOYMENT.md` for deployment instructions to Netlify or Vercel.

## License

MIT
