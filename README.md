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

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

Go to your Supabase SQL Editor and run:
1. `database-schema.sql`
2. `rls-policies.sql`
3. `fix-rls-policies.sql` (Important for user registration)

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)

## License

MIT
