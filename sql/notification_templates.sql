-- Notification Templates for EduFlow System
-- Run this SQL script in your Supabase SQL Editor to create the required notification templates

-- 1. Controller Deduction Template (for teachers)
INSERT INTO notification_templates (type, name, title_template, message_template, is_active, created_by)
SELECT
  'controller_report',
  'controller_deduction',
  'Salary Deduction Processed - GH₵{{deduction_amount}}',
  'Your salary deduction of GH₵{{deduction_amount}} for {{report_period}} has been processed and added to your savings account.',
  true,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT (type, name) DO NOTHING;

-- 2. Controller Upload Success Template (for admins)
INSERT INTO notification_templates (type, name, title_template, message_template, is_active, created_by)
SELECT
  'controller_report',
  'controller_upload_success',
  'Controller Report Uploaded Successfully',
  'Controller report for {{report_period}} has been successfully uploaded, affecting {{affected_teachers}} teachers.',
  true,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT (type, name) DO NOTHING;

-- 3. Report Ready Template (for teachers)
INSERT INTO notification_templates (type, name, title_template, message_template, is_active, created_by)
SELECT
  'admin_report',
  'report_ready_teacher',
  'Financial Report Ready',
  'Your {{report_type}} for {{report_period}} is now available. Visit your reports page to download it.',
  true,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT (type, name) DO NOTHING;

-- 4. Report Generation Success Template (for admins)
INSERT INTO notification_templates (type, name, title_template, message_template, is_active, created_by)
SELECT
  'admin_report',
  'report_generation_success',
  'Report Generation Completed',
  'Successfully generated reports for {{teachers_count}} teachers covering {{report_period}}.',
  true,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT (type, name) DO NOTHING;

-- 5. Quarterly Interest Admin Template (for admins)
INSERT INTO notification_templates (type, name, title_template, message_template, is_active, created_by)
SELECT
  'interest_payment',
  'quarterly_interest_admin',
  'Interest Payment Completed - GH₵{{total_amount}}',
  'Successfully processed interest payments for {{payment_period}}. Total amount of GH₵{{total_amount}} distributed to {{teachers_count}} teachers.',
  true,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT (type, name) DO NOTHING;

-- Verify all templates were created
SELECT name, type, title_template, is_active
FROM notification_templates
WHERE name IN (
  'controller_deduction',
  'controller_upload_success',
  'report_ready_teacher',
  'report_generation_success',
  'quarterly_interest_admin'
)
ORDER BY type, name;