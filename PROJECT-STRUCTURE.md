# Hospital Management System - Project Structure

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend & Database
- **Backend**: Supabase
  - PostgreSQL Database
  - Authentication (JWT)
  - Row Level Security (RLS)
  - Edge Functions (Deno)
  - Real-time Subscriptions
  - Storage for documents/images

### External Services
- **Email**: SendGrid
- **SMS**: Twilio
- **Payments**: Stripe
- **File Storage**: Supabase Storage

---

## Project Directory Structure

```
hospital-management-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   ├── beds/
│   │   │   └── audit-logs/
│   │   ├── patient/
│   │   │   ├── appointments/
│   │   │   ├── medical-records/
│   │   │   ├── prescriptions/
│   │   │   └── billing/
│   │   ├── doctor/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   └── prescriptions/
│   │   ├── receptionist/
│   │   │   ├── check-in/
│   │   │   ├── appointments/
│   │   │   └── billing/
│   │   └── layout.tsx
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                       # Shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── appointments/
│   │   ├── AppointmentCalendar.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── AppointmentList.tsx
│   ├── medical-records/
│   │   ├── MedicalRecordForm.tsx
│   │   ├── VitalsForm.tsx
│   │   └── RecordViewer.tsx
│   ├── prescriptions/
│   │   ├── PrescriptionForm.tsx
│   │   └── PrescriptionViewer.tsx
│   ├── billing/
│   │   ├── InvoiceForm.tsx
│   │   └── PaymentForm.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── LoadingSpinner.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   ├── server.ts             # Server-side client
│   │   └── middleware.ts         # Auth middleware
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAppointments.ts
│   │   ├── useMedicalRecords.ts
│   │   └── useInvoices.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   └── types/
│       ├── database.types.ts     # Generated from Supabase
│       ├── user.types.ts
│       └── appointment.types.ts
│
├── store/
│   ├── authStore.ts
│   ├── appointmentStore.ts
│   └── notificationStore.ts
│
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── create-user-account/
│   │   ├── get-available-slots/
│   │   ├── send-appointment-reminder/
│   │   └── generate-invoice/
│   ├── migrations/               # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   └── config.toml
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Setup Instructions

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest hospital-management-system --typescript --tailwind --app
cd hospital-management-system
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# UI & Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install lucide-react class-variance-authority clsx tailwind-merge

# State & Data
npm install zustand @tanstack/react-query

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Date & Time
npm install date-fns

# Charts
npm install recharts

# Payments
npm install @stripe/stripe-js

# Dev dependencies
npm install -D @types/node
```

### 3. Initialize Shadcn/ui

```bash
npx shadcn-ui@latest init
```

Add components:
```bash
npx shadcn-ui@latest add button input label card table dialog select
```

### 4. Setup Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in project
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

### 5. Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External Services
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### 6. Generate TypeScript Types from Supabase

```bash
supabase gen types typescript --project-id your-project-ref > lib/types/database.types.ts
```

### 7. Run Database Migrations

```bash
# Apply schema
supabase db push

# Or use migrations
supabase migration new initial_schema
# Copy SQL from database-schema.sql
supabase db push
```

### 8. Deploy Edge Functions

```bash
supabase functions deploy create-user-account
supabase functions deploy get-available-slots
supabase functions deploy send-appointment-reminder
```

---

## Key Features Implementation Priority

### Phase 1: Core Authentication & User Management
1. User registration (patients)
2. Login/logout
3. Admin user creation
4. Role-based access control

### Phase 2: Appointment System
1. Doctor availability management
2. Appointment booking
3. Appointment calendar view
4. Check-in/check-out

### Phase 3: Medical Records
1. EMR creation and viewing
2. Vitals recording
3. Medical history

### Phase 4: Prescriptions
1. e-Prescribing
2. Prescription viewing/downloading
3. Pharmacy integration

### Phase 5: Billing
1. Invoice generation
2. Payment processing
3. Insurance integration

### Phase 6: Additional Features
1. Lab tests
2. Bed management
3. Notifications
4. Audit logs
5. Reports & analytics

---

## Security Checklist

- ✅ JWT authentication with Supabase Auth
- ✅ Row Level Security (RLS) policies
- ✅ Password hashing (handled by Supabase)
- ✅ HTTPS only
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Supabase handles this)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting on Edge Functions
- ✅ Audit logging
- ✅ Data encryption at rest (Supabase default)
- ✅ HIPAA compliance considerations

---

## Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Database Changes**
   ```bash
   supabase migration new migration_name
   # Edit migration file
   supabase db push
   ```

3. **Type Generation**
   ```bash
   npm run generate-types
   ```

4. **Testing**
   ```bash
   npm run test
   ```

5. **Deployment**
   ```bash
   # Deploy to Vercel
   vercel deploy --prod
   ```
