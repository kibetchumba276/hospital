# Hospital Management System - API Endpoints

## Base URL
```
https://your-project.supabase.co
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 User Registration (Patient Self-Registration)
```
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePassword123",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01"
  }
}
```

### 1.2 User Login
```
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 1.3 Admin: Create User Account
```
POST /rest/v1/rpc/create_user_account
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "tempPassword123",
  "role": "doctor",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "department_id": "uuid-here",
  "specialization": "Cardiology",
  "license_number": "MD12345"
}
```

---

## 2. APPOINTMENT MANAGEMENT

### 2.1 Get Available Slots
```
GET /rest/v1/rpc/get_available_slots
  ?doctor_id=uuid-here
  &date=2024-03-20

Response:
[
  {
    "time": "09:00:00",
    "available": true
  },
  {
    "time": "09:30:00",
    "available": false
  }
]
```

### 2.2 Book Appointment (Patient)
```
POST /rest/v1/appointments
Content-Type: application/json

{
  "patient_id": "uuid-here",
  "doctor_id": "uuid-here",
  "appointment_date": "2024-03-20",
  "appointment_time": "09:00:00",
  "reason_for_visit": "Regular checkup"
}
```

### 2.3 Get Patient Appointments
```
GET /rest/v1/appointments
  ?patient_id=eq.uuid-here
  &select=*,doctor:staff(user:users(first_name,last_name)),department:departments(name)
  &order=appointment_date.desc,appointment_time.desc
```

### 2.4 Update Appointment Status (Receptionist)
```
PATCH /rest/v1/appointments?id=eq.uuid-here
Content-Type: application/json

{
  "status": "checked_in",
  "checked_in_at": "2024-03-20T09:05:00Z"
}
```

### 2.5 Cancel/Reschedule Appointment
```
PATCH /rest/v1/appointments?id=eq.uuid-here
Content-Type: application/json

{
  "status": "cancelled"
}
```

---

## 3. ELECTRONIC MEDICAL RECORDS (EMR)

### 3.1 Get Patient Medical History
```
GET /rest/v1/medical_records
  ?patient_id=eq.uuid-here
  &select=*,doctor:staff(user:users(first_name,last_name)),vitals(*),prescriptions(*)
  &order=visit_date.desc
```

### 3.2 Create Medical Record (Doctor)
```
POST /rest/v1/medical_records
Content-Type: application/json

{
  "patient_id": "uuid-here",
  "appointment_id": "uuid-here",
  "doctor_id": "uuid-here",
  "chief_complaint": "Chest pain",
  "diagnosis": "Angina pectoris",
  "treatment_plan": "Medication and lifestyle changes",
  "notes": "Follow up in 2 weeks"
}
```

### 3.3 Add Vitals
```
POST /rest/v1/vitals
Content-Type: application/json

{
  "medical_record_id": "uuid-here",
  "patient_id": "uuid-here",
  "temperature": 98.6,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "heart_rate": 72,
  "oxygen_saturation": 98.5,
  "weight": 70.5,
  "height": 175.0,
  "recorded_by": "uuid-here"
}
```

---

## 4. PRESCRIPTIONS (e-Prescribing)

### 4.1 Create Prescription
```
POST /rest/v1/prescriptions
Content-Type: application/json

{
  "medical_record_id": "uuid-here",
  "patient_id": "uuid-here",
  "doctor_id": "uuid-here",
  "notes": "Take with food"
}

Then add items:
POST /rest/v1/prescription_items
{
  "prescription_id": "uuid-here",
  "medicine_name": "Aspirin",
  "dosage": "100mg",
  "frequency": "Once daily",
  "duration": "30 days",
  "quantity": 30,
  "instructions": "Take after breakfast"
}
```

### 4.2 Get Patient Prescriptions
```
GET /rest/v1/prescriptions
  ?patient_id=eq.uuid-here
  &select=*,doctor:staff(user:users(first_name,last_name)),items:prescription_items(*)
  &order=created_at.desc
```

### 4.3 Download Prescription (PDF)
```
GET /rest/v1/rpc/generate_prescription_pdf
  ?prescription_id=uuid-here
```

---

## 5. BILLING & PAYMENTS

### 5.1 Create Invoice (Receptionist)
```
POST /rest/v1/rpc/create_invoice
Content-Type: application/json

{
  "patient_id": "uuid-here",
  "appointment_id": "uuid-here",
  "items": [
    {
      "description": "Consultation Fee",
      "quantity": 1,
      "unit_price": 100.00
    },
    {
      "description": "Lab Test - CBC",
      "quantity": 1,
      "unit_price": 50.00
    }
  ],
  "discount_amount": 10.00,
  "tax_amount": 14.00
}
```

### 5.2 Get Patient Invoices
```
GET /rest/v1/invoices
  ?patient_id=eq.uuid-here
  &select=*,items:invoice_items(*),payments(*)
  &order=created_at.desc
```

### 5.3 Process Payment
```
POST /rest/v1/payments
Content-Type: application/json

{
  "invoice_id": "uuid-here",
  "amount": 154.00,
  "payment_method": "credit_card",
  "transaction_id": "stripe_ch_xxx"
}
```

---

## 6. DOCTOR DASHBOARD

### 6.1 Get Today's Patient Queue
```
GET /rest/v1/appointments
  ?doctor_id=eq.uuid-here
  &appointment_date=eq.2024-03-20
  &select=*,patient:patients(user:users(first_name,last_name),blood_group,allergies)
  &order=appointment_time.asc
```

### 6.2 Get Patient Summary
```
GET /rest/v1/rpc/get_patient_summary
  ?patient_id=uuid-here

Response:
{
  "patient_info": {...},
  "recent_visits": [...],
  "active_prescriptions": [...],
  "allergies": [...],
  "chronic_conditions": [...]
}
```

---

## 7. LAB TESTS

### 7.1 Request Lab Test (Doctor)
```
POST /rest/v1/lab_tests
Content-Type: application/json

{
  "patient_id": "uuid-here",
  "doctor_id": "uuid-here",
  "medical_record_id": "uuid-here",
  "test_name": "Complete Blood Count",
  "test_type": "Hematology",
  "notes": "Fasting required"
}
```

### 7.2 Update Lab Test Results (Lab Technician)
```
PATCH /rest/v1/lab_tests?id=eq.uuid-here
Content-Type: application/json

{
  "status": "completed",
  "results": "WBC: 7500, RBC: 5.2M, Hemoglobin: 14.5",
  "completed_at": "2024-03-20T14:30:00Z",
  "technician_id": "uuid-here"
}
```

---

## 8. ADMIN FUNCTIONS

### 8.1 Create Department
```
POST /rest/v1/departments
Content-Type: application/json

{
  "name": "Cardiology",
  "description": "Heart and cardiovascular care",
  "head_doctor_id": "uuid-here"
}
```

### 8.2 Manage Bed Inventory
```
POST /rest/v1/beds
Content-Type: application/json

{
  "ward_id": "uuid-here",
  "bed_number": "ICU-101",
  "bed_type": "ICU",
  "daily_rate": 500.00
}
```

### 8.3 View Audit Logs
```
GET /rest/v1/audit_logs
  ?select=*,user:users(first_name,last_name,email)
  &order=created_at.desc
  &limit=100
```

### 8.4 Get System Statistics
```
GET /rest/v1/rpc/get_system_stats

Response:
{
  "total_patients": 1250,
  "total_doctors": 45,
  "appointments_today": 87,
  "pending_invoices": 23,
  "available_beds": 12
}
```

---

## 9. NOTIFICATIONS

### 9.1 Send Appointment Reminder
```
POST /functions/v1/send-appointment-reminder
Content-Type: application/json

{
  "appointment_id": "uuid-here",
  "method": "email" // or "sms"
}
```

---

## SUPABASE REALTIME SUBSCRIPTIONS

### Subscribe to Appointment Updates
```javascript
const subscription = supabase
  .channel('appointments')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'appointments',
      filter: `doctor_id=eq.${doctorId}`
    }, 
    (payload) => {
      console.log('Appointment updated:', payload)
    }
  )
  .subscribe()
```

### Subscribe to New Lab Results
```javascript
const subscription = supabase
  .channel('lab_tests')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'lab_tests',
      filter: `patient_id=eq.${patientId}`
    }, 
    (payload) => {
      if (payload.new.status === 'completed') {
        // Notify patient of new results
      }
    }
  )
  .subscribe()
```
