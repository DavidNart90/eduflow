-- Fix report_templates foreign key constraint
-- The created_by field should reference the users table, not auth.users

-- First, let's drop the existing foreign key constraint
ALTER TABLE report_templates DROP CONSTRAINT IF EXISTS report_templates_created_by_fkey;

-- Add the correct foreign key constraint to reference users table
ALTER TABLE report_templates ADD CONSTRAINT report_templates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update RLS policies to work with users table
DROP POLICY IF EXISTS "Admins can create report templates" ON report_templates;
DROP POLICY IF EXISTS "Admins can update report templates" ON report_templates;
DROP POLICY IF EXISTS "Admins can delete report templates" ON report_templates;

-- Recreate policies with correct user table reference
CREATE POLICY "Admins can create report templates" ON report_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can update report templates" ON report_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete report templates" ON report_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Allow templates to be created without created_by (for default templates)
ALTER TABLE report_templates ALTER COLUMN created_by DROP NOT NULL;
