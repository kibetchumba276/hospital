-- Test script to require password change for a user
-- Replace 'user@example.com' with the actual email you want to test

-- Set a specific user to require password change
UPDATE users 
SET must_change_password = true 
WHERE email = 'user@example.com';

-- Or set all users to require password change (for testing)
-- UPDATE users SET must_change_password = true;

-- Check which users need to change password
SELECT 
  email, 
  first_name, 
  last_name, 
  role, 
  must_change_password 
FROM users 
WHERE must_change_password = true;

SELECT '✅ Password change requirement set!' as status;
