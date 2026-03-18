-- Migration: Add staff_number to staff table
-- Run this if you already have the database set up

-- Add staff_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'staff_number'
    ) THEN
        ALTER TABLE staff ADD COLUMN staff_number VARCHAR(20);
        
        -- Generate staff numbers for existing staff using a subquery
        WITH numbered_staff AS (
            SELECT id, 'STF' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0') as new_staff_number
            FROM staff
            WHERE staff_number IS NULL
        )
        UPDATE staff
        SET staff_number = numbered_staff.new_staff_number
        FROM numbered_staff
        WHERE staff.id = numbered_staff.id;
        
        -- Make it NOT NULL and UNIQUE after populating
        ALTER TABLE staff ALTER COLUMN staff_number SET NOT NULL;
        ALTER TABLE staff ADD CONSTRAINT staff_number_unique UNIQUE (staff_number);
    END IF;
END $$;

-- Verify
SELECT id, user_id, staff_number, specialization FROM staff;
