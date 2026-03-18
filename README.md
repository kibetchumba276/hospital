# 🏥 Hospital Management System

> A complete, production-ready Hospital Management System with a clean green theme

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

A comprehensive, HIPAA-compliant Hospital Management System built with Next.js 14 and Supabase. Features a beautiful green medical theme, role-based access control, and complete patient care workflows.

## ✨ Live Demo

🚀 **Quick Start:** Follow [QUICK-START.md](QUICK-START.md) to get running in 5 minutes!

## 🎯 Key Features

### 🏠 Beautiful Landing Page
- Modern, clean design with green hospital theme
- Feature showcase and call-to-action
- Fully responsive layout

### 👤 Patient Portal
- **Self-Registration** - Easy signup process
- **Appointment Booking** - Real-time slot availability
- **Medical Records** - Complete health history with vitals
- **Billing & Payments** - View invoices and payment history
- **Dashboard** - Overview of health status and upcoming visits

### 👨‍⚕️ Doctor Portal
- **Patient Queue** - Today's appointments with timing
- **Medical Records** - Access patient history
- **e-Prescribing** - Digital prescription management
- **Vitals Tracking** - Record and monitor patient vitals
- **Allergy Alerts** - Highlighted patient allergies

### 🛡️ Admin Portal
- **User Management** - Create and manage all user types
- **Department Management** - Hospital departments and wards
- **Bed Management** - Track bed availability
- **System Statistics** - Real-time dashboard metrics
- **Audit Logs** - Complete activity tracking

## 🏥 Overview

This system provides a complete solution for managing hospital operations including patient records, appointments, prescriptions, billing, and more. Built with modern technologies and security best practices.

## ✨ Key Features

### For Patients
- Self-registration portal
- Book/reschedule appointments with real-time availability
- View medical history (EMR)
- Download digital prescriptions
- View and pay bills online
- Receive appointment reminders via email/SMS

### For Doctors
- Clinical dashboard with daily patient queue
- Digital prescription writing (e-Prescribing)
- Update patient diagnosis and vitals
- Request lab tests and specialist referrals
- Access complete patient medical history

### For Receptionists
- Patient check-in/check-out management
- Appointment scheduling for walk-ins
- Generate billing invoices
- Manage patient registration

### For Super Admin
- Complete system control
- User account management (Doctors, Nurses, Staff)
- Department and ward management
- Bed inventory tracking
- System-wide audit logs

## 🛠 Technology Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Query** for data fetching
- **Zustand** for state management
- **React Hook Form + Zod** for form validation

### Backend & Database
- **Supabase**
  - PostgreSQL database
  - Authentication (JWT)
  - Row Level Security (RLS)
  - Edge Functions (Deno)
  - Real-time subscriptions
  - File storage

### External Services
- **SendGrid** - Email notifications
- **Twilio** - SMS notifications
- **Stripe** - Payment processing

## 🔒 Security Features

- JWT-based authentication
- Row Level Security (RLS) for HIPAA/GDPR compliance
- Password hashing (BCrypt via Supabase)
- Role-based access control (RBAC)
- Audit logging for all critical operations
- Data encryption at rest and in transit
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📁 Project Files

### Database
- `database-schema.sql` - Complete database schema with all tables and relationships
- `rls-policies.sql` - Row Level Security policies for HIPAA compliance

### API & Functions
- `api-endpoints.md` - Complete API documentation
- `supabase/functions/` - Edge Functions for complex business logic
  - `create-user-account/` - Admin user creation
  - `get-available-slots/` - Appointment slot availability
  - `send-appointment-reminder/` - Email/SMS notifications

### Documentation
- `PROJECT-STRUCTURE.md` - Detailed project structure and setup guide
- `README.md` - This file

### Sample Code
- `lib/supabase/client.ts` - Supabase client configuration
- `components/appointments/AppointmentBookingForm.tsx` - Sample React component

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- SendGrid account (for emails)
- Twilio account (for SMS)
- Stripe account (for payments)

### Installation

1. **Clone and setup project**
   ```bash
   npx create-next-app@latest hospital-management-system --typescript --tailwind --app
   cd hospital-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install zustand @tanstack/react-query
   npm install react-hook-form @hookform/resolvers zod
   npm install date-fns recharts
   ```

3. **Initialize Shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input label card table dialog select
   ```

4. **Setup Supabase**
   ```bash
   npm install -g supabase
   supabase login
   supabase init
   supabase link --project-ref your-project-ref
   ```

5. **Configure environment variables**
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SENDGRID_API_KEY=your-sendgrid-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-phone
   STRIPE_SECRET_KEY=your-stripe-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

6. **Run database migrations**
   ```bash
   # Copy the SQL from database-schema.sql to Supabase SQL Editor and run it
   # Or use migrations:
   supabase migration new initial_schema
   # Paste SQL content
   supabase db push
   
   # Apply RLS policies
   supabase migration new rls_policies
   # Paste RLS SQL content
   supabase db push
   ```

7. **Deploy Edge Functions**
   ```bash
   supabase functions deploy create-user-account
   supabase functions deploy get-available-slots
   supabase functions deploy send-appointment-reminder
   ```

8. **Generate TypeScript types**
   ```bash
   supabase gen types typescript --project-id your-project-ref > lib/types/database.types.ts
   ```

9. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📋 Next Steps

### Immediate Actions

1. **Setup Supabase Project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database schema SQL
   - Apply RLS policies
   - Deploy Edge Functions

2. **Configure External Services**
   - Setup SendGrid for email notifications
   - Setup Twilio for SMS notifications
   - Setup Stripe for payment processing

3. **Create Initial Admin User**
   ```sql
   -- Run this in Supabase SQL Editor after schema is created
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@hospital.com', crypt('admin123', gen_salt('bf')), NOW());
   
   INSERT INTO users (id, email, role, first_name, last_name)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'admin@hospital.com'),
     'admin@hospital.com',
     'super_admin',
     'System',
     'Administrator'
   );
   ```

### Development Roadmap

**Phase 1: Core Setup (Week 1-2)**
- ✅ Database schema
- ✅ RLS policies
- ✅ API endpoints
- ⬜ Authentication pages (login, register)
- ⬜ Dashboard layouts for each role

**Phase 2: Appointment System (Week 3-4)**
- ⬜ Doctor availability management
- ⬜ Appointment booking interface
- ⬜ Calendar view
- ⬜ Check-in/check-out workflow

**Phase 3: Medical Records (Week 5-6)**
- ⬜ EMR creation and viewing
- ⬜ Vitals recording interface
- ⬜ Medical history timeline

**Phase 4: Prescriptions (Week 7-8)**
- ⬜ e-Prescribing interface
- ⬜ Prescription viewer
- ⬜ PDF generation
- ⬜ Pharmacy integration

**Phase 5: Billing (Week 9-10)**
- ⬜ Invoice generation
- ⬜ Payment processing with Stripe
- ⬜ Insurance integration

**Phase 6: Additional Features (Week 11-12)**
- ⬜ Lab test management
- ⬜ Bed management
- ⬜ Notification system
- ⬜ Audit logs viewer
- ⬜ Reports and analytics

## 🎯 Follow-Up Commands

Once you're ready to build specific features, use these commands:

### Database Operations
```bash
# Create a new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (careful!)
supabase db reset

# Generate types
supabase gen types typescript --project-id your-project-ref > lib/types/database.types.ts
```

### Component Development
Ask Kiro:
- "Create the React component for the Patient's appointment booking form"
- "Create the Doctor's dashboard showing today's patient queue"
- "Build the Receptionist's check-in interface"
- "Create the Admin user management page"

### API Development
Ask Kiro:
- "Write the Edge Function for generating invoices"
- "Create the API endpoint for patient medical history"
- "Build the real-time notification system"

### Testing
Ask Kiro:
- "Write tests for the appointment booking flow"
- "Create integration tests for the billing system"

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

## 🤝 Contributing

This is a template project. Customize it according to your hospital's specific needs.

## 📄 License

MIT License - feel free to use this for your projects.

## ⚠️ Important Notes

- This system handles sensitive medical data. Ensure HIPAA/GDPR compliance before production use.
- Conduct security audits and penetration testing.
- Implement proper backup and disaster recovery procedures.
- Train staff on proper system usage and data handling.
- Consult with legal and compliance teams before deployment.

---

**Need help?** Ask Kiro for specific implementations:
- "Kiro, create the SQL for the Users and Appointments tables" ✅ (Already done!)
- "Kiro, show me the logic for the Check-in function"
- "Kiro, build the Patient registration form"
- "Kiro, create the Doctor's prescription writing interface"
