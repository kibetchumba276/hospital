-- Add field to track if user needs to change password
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Update existing users to not require password change
UPDATE users SET must_change_password = false WHERE must_change_password IS NULL;

SELECT '✅ Password change tracking added!' as status;
