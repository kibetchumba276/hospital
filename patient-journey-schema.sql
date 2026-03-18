-- Patient Journey Workflow Schema Updates

-- 1. Add QR code and verification fields to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_code_data JSONB;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- 2. Add verification fields to prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dispensed_by UUID REFERENCES users(id);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMP;

-- 3. Add verification fields to lab_orders
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS sample_collected_by UUID REFERENCES users(id);
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS sample_collected_at TIMESTAMP;

-- 4. Create invoice_adjustments table
CREATE TABLE IF NOT EXISTS invoice_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  adjusted_by UUID REFERENCES users(id),
  adjustment_type VARCHAR(50), -- 'add_item', 'remove_item', 'update_quantity'
  item_type VARCHAR(50), -- 'medication', 'lab_test', 'service'
  item_id UUID,
  item_name TEXT,
  previous_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  quantity_change INTEGER,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create prescription_items table (for detailed medication tracking)
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit VARCHAR(50),
  instructions TEXT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  dispensed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create lab_test_items table (for detailed test tracking)
CREATE TABLE IF NOT EXISTS lab_test_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50),
  unit_price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sample_collected, in_progress, completed
  result TEXT,
  normal_range TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 7. Add check-in fields to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_ended_at TIMESTAMP;

-- 8. Create patient_queue table (for managing patient flow)
CREATE TABLE IF NOT EXISTS patient_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES staff(id),
  queue_number INTEGER,
  status VARCHAR(50) DEFAULT 'waiting', -- waiting, in_consultation, completed, cancelled
  checked_in_at TIMESTAMP DEFAULT NOW(),
  called_at TIMESTAMP,
  consultation_started_at TIMESTAMP,
  consultation_ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Enable RLS on new tables
ALTER TABLE invoice_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_queue ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for invoice_adjustments
CREATE POLICY "Staff can view invoice adjustments"
ON invoice_adjustments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'receptionist', 'pharmacist', 'lab_technician', 'doctor')
  )
);

CREATE POLICY "Staff can create invoice adjustments"
ON invoice_adjustments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'receptionist', 'pharmacist', 'lab_technician')
  )
);

-- 11. RLS Policies for prescription_items
CREATE POLICY "Staff can view prescription items"
ON prescription_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor', 'pharmacist', 'nurse')
  )
);

CREATE POLICY "Doctors can create prescription items"
ON prescription_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor')
  )
);

CREATE POLICY "Pharmacists can update prescription items"
ON prescription_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'pharmacist')
  )
);

-- 12. RLS Policies for lab_test_items
CREATE POLICY "Staff can view lab test items"
ON lab_test_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor', 'lab_technician', 'nurse')
  )
);

CREATE POLICY "Doctors can create lab test items"
ON lab_test_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor')
  )
);

CREATE POLICY "Lab techs can update lab test items"
ON lab_test_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'lab_technician')
  )
);

-- 13. RLS Policies for patient_queue
CREATE POLICY "Staff can view patient queue"
ON patient_queue FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'doctor', 'nurse', 'receptionist')
  )
);

CREATE POLICY "Receptionists can manage patient queue"
ON patient_queue FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'receptionist')
  )
);

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_qr_code ON invoices(qr_code);
CREATE INDEX IF NOT EXISTS idx_prescriptions_payment_verified ON prescriptions(payment_verified);
CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_verified ON lab_orders(payment_verified);
CREATE INDEX IF NOT EXISTS idx_patient_queue_status ON patient_queue(status);
CREATE INDEX IF NOT EXISTS idx_patient_queue_doctor ON patient_queue(doctor_id, status);

SELECT '✅ Patient journey schema created successfully!' as status;
