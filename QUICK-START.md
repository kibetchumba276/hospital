# 🚀 Quick Start Guide

Get your Hospital Management System running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git

## Step 1: Clone & Install (1 min)

```bash
git clone https://github.com/kibetchumba276/hospital.git
cd hospital
npm install
```

## Step 2: Supabase Setup (3 mins)

### A. Run Database Scripts

1. Open your Supabase project
2. Go to **SQL Editor**
3. Run these files in order (copy/paste each one):
   - `database-schema.sql`
   - `rls-policies.sql`
   - `fix-rls-policies.sql`

### B. Create Admin User

1. Go to **Authentication** > **Users** > **Add User**
2. Email: `sammyseth260@gmail.com`
3. Password: (your choice)
4. **Auto Confirm: YES** ✅
5. Copy the User ID
6. In **SQL Editor**, run:

```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('PASTE_USER_ID', 'sammyseth260@gmail.com', 'super_admin', 'Admin', 'User', true);
```

## Step 3: Start App (1 min)

```bash
npm run dev
```

Open http://localhost:3000

## 🎉 Done!

**Login as Admin:**
- URL: http://localhost:3000/login
- Email: sammyseth260@gmail.com
- Password: (what you set)

**Register as Patient:**
- URL: http://localhost:3000/register
- Fill the form and create account

## ⚡ What's Fixed

✅ No more redirect loops
✅ Fast loading with session caching
✅ Registration works perfectly
✅ Session persists across page refreshes
✅ Proper error handling

## 📚 More Info

- Full setup: `SUPABASE-SETUP-CHECKLIST.md`
- Troubleshooting: `AUTH-FIX-GUIDE.md`
- Deployment: `DEPLOYMENT.md`
- Features: `README.md`

## 🆘 Need Help?

Check the console for errors and see `AUTH-FIX-GUIDE.md` for solutions.
