# Hospital Management System - Setup Guide

## Quick Setup

### 1. Database Setup (Run in Supabase SQL Editor)

Run these SQL files in order:

1. `database-schema.sql` - Creates all tables
2. `patient-journey-schema-safe.sql` - Adds patient journey features
3. `add-password-change-field.sql` - Adds password change functionality
4. `FIX-APPOINTMENT-RLS-COMPLETE.sql` - Fixes permissions for appointments
5. `setup-common-departments.sql` - Creates common departments
6. `setup-admin.sql` - Creates admin user
7. `create-test-users.sql` - (Optional) Creates test users

### 2. Environment Setup

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## System Features

### User Roles
- Super Admin - Full system access
- Doctor - Patient care, prescriptions, billing
- Nurse - Patient vitals, medications
- Receptionist - Check-in, appointments, registration
- Pharmacist - Prescription verification, dispensing
- Lab Technician - Lab orders, results
- Patient - Book appointments, view records

### Key Features
- Password change on first login (default: 123456)
- Auto-assignment of staff for appointments
- Future-only appointment booking
- Emergency appointments (all staff available)
- QR code verification for pharmacy/lab
- Working hours: 8 AM - 5 PM East African Time
- 1-hour appointment slots

## Default Departments
- Emergency (all staff)
- General Medicine
- Dental
- Pediatrics
- Maternity
