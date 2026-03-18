# Patient Journey Workflow

## Complete Patient Flow Through Hospital

### 1. RECEPTION (Check-In)
**When patient arrives:**
- Receptionist searches patient by email
- System shows if patient has appointment today
- Receptionist checks patient in
- Status changes: `scheduled` → `checked_in`
- Patient joins doctor's queue

### 2. DOCTOR CONSULTATION
**Doctor sees patient:**
- Reviews patient history
- Records diagnosis
- Can send patient to:
  - **Pharmacy** (writes prescription)
  - **Laboratory** (orders tests)
  - **Both** (prescription + lab tests)
- Creates invoice for services

### 3. BILLING/PAYMENT
**Patient pays at reception:**
- Invoice generated with all items:
  - Consultation fee
  - Prescribed medications
  - Lab tests ordered
- Patient pays invoice
- System generates receipt with QR code
- QR code contains: invoice_id, patient_id, payment_status, items

### 4. PHARMACY (If prescribed)
**Pharmacist workflow:**
1. Patient presents QR code receipt
2. Pharmacist scans QR code
3. System verifies:
   - ✅ Payment confirmed
   - ✅ Doctor prescribed medications
   - ✅ Items match invoice
4. If verified, pharmacist dispenses medications
5. Pharmacist can adjust invoice if needed (add/remove items)
6. Marks prescription as `dispensed`

### 5. LABORATORY (If tests ordered)
**Lab Technician workflow:**
1. Patient presents QR code receipt
2. Lab tech scans QR code
3. System verifies:
   - ✅ Payment confirmed
   - ✅ Doctor ordered tests
   - ✅ Tests match invoice
4. If verified, lab tech collects samples
5. Lab tech can adjust invoice if needed (add/remove tests)
6. Processes tests and enters results
7. Marks tests as `completed`

## Key Features

### QR Code Receipt
- Generated after payment
- Contains encrypted data:
  - Invoice ID
  - Patient ID
  - Payment status
  - Timestamp
  - Items (medications/tests)
- Can be scanned by pharmacy and lab

### Payment Verification
- Pharmacy cannot dispense without payment proof
- Lab cannot process without payment proof
- QR code is the verification method

### Invoice Adjustment
- Pharmacist can adjust medication quantities
- Lab tech can add additional tests
- Adjustments update invoice
- Patient pays difference if needed

### Status Tracking
- Appointment: scheduled → checked_in → in_consultation → completed
- Prescription: pending → verified → dispensed
- Lab Order: pending → verified → sample_collected → in_progress → completed

## Database Changes Needed

1. Add QR code field to invoices
2. Add verification status to prescriptions
3. Add verification status to lab_orders
4. Add payment_verified field
5. Add invoice_adjustments table

## Implementation Order

1. ✅ Create role-based dashboards
2. 🔄 Receptionist check-in system
3. 🔄 Doctor prescription/lab order system
4. 🔄 Billing with QR code generation
5. 🔄 Pharmacy verification & dispensing
6. 🔄 Lab verification & processing
7. 🔄 Invoice adjustment system
