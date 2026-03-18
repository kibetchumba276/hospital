-- Migration: Add staff_number to staff table
-- Run this if you already have the database set up

-- Add staff_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'staff_number'
    ) THEN
        ALTER TABLE staff ADD COLUMN staff_number VARCHAR(20) UNIQUE;
        
        -- Generate staff numbers for existing staff
        UPDATE staff 
        SET staff_number = 'STF' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0')
        WHERE staff_number IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE staff ALTER COLUMN staff_number SET NOT NULL;
    END IF;
END $$;

-- Verify
SELECT id, user_id, staff_number, specialization FROM staff;
