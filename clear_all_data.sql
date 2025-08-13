-- Clear All Data Script for EduFlow Database
-- WARNING: This will delete ALL data from the database
-- Run this script carefully as it cannot be undone

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Clear all application data tables
DELETE FROM email_notifications;
DELETE FROM controller_reports;
DELETE FROM savings_transactions;
DELETE FROM users;

-- Clear all auth users (Supabase Auth)
-- Note: This requires admin privileges on the auth schema
DELETE FROM auth.users WHERE email != 'admin@eduflow.com'; -- Keep admin user

-- Reset sequences to start from 1
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS savings_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS controller_reports_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS email_notifications_id_seq RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'savings_transactions' as table_name, COUNT(*) as row_count FROM savings_transactions
UNION ALL
SELECT 'controller_reports' as table_name, COUNT(*) as row_count FROM controller_reports
UNION ALL
SELECT 'email_notifications' as table_name, COUNT(*) as row_count FROM email_notifications;

-- Optional: Re-insert the default admin user
INSERT INTO users (employee_id, email, full_name, role, management_unit) 
VALUES ('ADMIN001', 'admin@eduflow.com', 'System Administrator', 'admin', 'System')
ON CONFLICT (employee_id) DO NOTHING;

-- Show final status
SELECT 'Data cleared successfully!' as status;





