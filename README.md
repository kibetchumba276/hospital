# 🏥 Hospital Management System

A complete, production-ready Hospital Management System built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## ✨ Features

### For Administrators
- 👨‍⚕️ Create and manage doctor accounts
- 🔢 Auto-generate unique staff numbers
- 🏷️ Set doctor specializations (Dentist, Cardiologist, etc.)
- 🔐 Activate/deactivate user accounts
- 🔍 Advanced search and filtering

### For Doctors
- 👥 Search and view all patients
- 📋 Diagnose patients with comprehensive medical records
- 💰 Create detailed invoices with line items
- 🛏️ Admit patients and assign beds
- 📅 View and manage appointments
- 📊 Record patient vitals

### For Patients
- 📝 Self-registration portal
- 📅 Book appointments by doctor specialization
- 👀 View appointment history and status
- 💳 View bills and pay online
- 📄 Download payment receipts
- 🏥 Access complete medical history
- 💊 View diagnoses and treatment plans

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### 1. Clone and Install
```bash
git clone https://github.com/kibetchumba276/hospital.git
cd hospital
npm install
```

### 2. Environment Setup
The `.env.local` file is already configured with Supabase credentials.

### 3. Database Setup

**Option A: Fresh Install**
1. Go to Supabase Dashboard > SQL Editor
2. Run `database-schema-safe.sql`
3. Run `rls-policies.sql`

**Option B: Verify Existing Setup**
1. Run `verify-setup.sql` to check your configuration
2. Follow the recommendations in the output

### 4. Create Admin User

**Method 1: Supabase Dashboard (Recommended)**
1. Go to Authentication > Users > Add User
2. Email: `sammyseth260@gmail.com`
3. Password: (your choice)
4. **Auto Confirm User: YES** ✅
5. Copy the User ID
6. Run in SQL Editor (replace USER_ID):
```sql
INSERT INTO users (id, email, role, first_name, last_name, is_active)
VALUES ('USER_ID'::uuid, 'sammyseth260@gmail.com', 'super_admin', 'Admin', 'User', true);
```

**Method 2: Use Test Users**
- Follow instructions in `create-test-users.sql`
- Creates admin, patient, and doctor accounts

### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## 📚 Documentation

- **[COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md)** - Comprehensive setup with testing
- **[TROUBLESHOOTING-ERRORS.md](TROUBLESHOOTING-ERRORS.md)** - Fix common issues
- **[WHAT-WE-BUILT.md](WHAT-WE-BUILT.md)** - Feature overview
- **[create-test-users.sql](create-test-users.sql)** - Create test accounts
- **[verify-setup.sql](verify-setup.sql)** - Verify your setup

## 🔧 Troubleshooting

### "Failed to fetch" on Login
- **Cause**: Supabase project is paused
- **Fix**: Go to Supabase Dashboard and resume the project

### "Email rate limit reached"
- **Cause**: Too many signup attempts
- **Fix**: Create users manually (see `create-test-users.sql`)

### More Issues?
Check [TROUBLESHOOTING-ERRORS.md](TROUBLESHOOTING-ERRORS.md) for detailed solutions.

## 🎯 User Workflows

### Admin Workflow
1. Login at `/login`
2. Go to `/admin/doctors`
3. Create doctor accounts with specializations
4. Manage system users

### Doctor Workflow
1. Login at `/login`
2. Search patients at `/doctor/patients`
3. Diagnose: Record vitals, diagnosis, treatment
4. Bill: Create invoices with line items
5. Admit: Assign beds to patients

### Patient Workflow
1. Register at `/register`
2. Book appointment by specialization at `/patient/appointments/book`
3. View appointments at `/patient/appointments`
4. View and pay bills at `/patient/billing`
5. Download receipts after payment
6. View medical records at `/patient/records`

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with roles
- `staff` - Doctor/nurse details with staff numbers
- `patients` - Patient profiles
- `appointments` - Appointment bookings
- `medical_records` - Diagnoses and treatments
- `vitals` - Patient vital signs
- `invoices` - Bills and payments
- `beds` - Hospital bed management
- `bed_assignments` - Patient admissions

### Security
- Row Level Security (RLS) enabled on all tables
- Patients can only access their own data
- Doctors can access all patient data
- Admins have full system access

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with session persistence
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Netlify (auto-deploy from GitHub)

## 📦 Project Structure

```
app/
├── admin/          # Admin dashboard
│   └── doctors/    # Doctor management
├── doctor/         # Doctor portal
│   └── patients/   # Patient management
│       └── [id]/   # Patient actions
├── patient/        # Patient portal
│   ├── appointments/  # View & book
│   ├── billing/    # View & pay bills
│   └── records/    # Medical history
├── login/          # Login page
└── register/       # Patient registration

lib/
├── supabase.ts     # Supabase client
└── utils.ts        # Utility functions

components/
└── ui/             # Reusable components
```

## 🔐 Default Credentials

After setup, you can create test accounts:

**Admin**
- Email: admin@test.com
- Password: Admin123!

**Patient**
- Email: patient@test.com
- Password: Patient123!

**Doctor (Dentist)**
- Email: dentist@test.com
- Password: Doctor123!

See `create-test-users.sql` for instructions.

## 🚢 Deployment

### Netlify (Automatic)
- Code is already configured for Netlify
- Pushes to `main` branch auto-deploy
- Environment variables are set

### Manual Deployment
1. Build: `npm run build`
2. Deploy `.next` folder
3. Set environment variables

## 🧪 Testing

### Test Complete Workflow
1. Create admin user
2. Admin creates doctor (Dentist)
3. Patient registers
4. Patient books appointment with Dentist
5. Doctor diagnoses patient
6. Doctor bills patient
7. Patient pays bill
8. Patient downloads receipt
9. Doctor admits patient to bed

See [COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md) for detailed testing steps.

## 📊 Features Checklist

- ✅ User authentication with session persistence
- ✅ Role-based access control (Admin, Doctor, Patient)
- ✅ Doctor management with specializations
- ✅ Patient registration and profiles
- ✅ Appointment booking by specialization
- ✅ Medical records with vitals
- ✅ Billing and invoicing
- ✅ Online payment processing
- ✅ Receipt generation
- ✅ Bed management and admissions
- ✅ Row Level Security (RLS)
- ✅ Responsive design
- ✅ Auto-deploy to Netlify

## 🤝 Contributing

This is a complete, production-ready system. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT

## 🆘 Support

Having issues? Check these resources:
1. [TROUBLESHOOTING-ERRORS.md](TROUBLESHOOTING-ERRORS.md)
2. [COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md)
3. Run `verify-setup.sql` to check your configuration
4. Check Supabase Dashboard > Logs for errors
5. Check browser console for client-side errors

## 🎉 Acknowledgments

Built with:
- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- Shadcn/ui components

---

**Live Demo**: (Deploy to Netlify to get your URL)

**Admin Email**: sammyseth260@gmail.com

**Status**: ✅ Production Ready
