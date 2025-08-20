-- Fixed Migration to update savings_transactions for Paystack integration
-- This script preserves existing data while adding new functionality

-- First, let's check what we're working with and add missing columns
ALTER TABLE savings_transactions 
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mobile_money',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update transaction_reference for existing records if it's NULL
UPDATE savings_transactions 
SET transaction_reference = reference_id 
WHERE transaction_reference IS NULL AND reference_id IS NOT NULL;

-- Add unique constraint if it doesn't exist (but handle case where constraint might fail)
DO $$
BEGIN
  BEGIN
    ALTER TABLE savings_transactions ADD CONSTRAINT savings_transactions_transaction_reference_key UNIQUE (transaction_reference);
  EXCEPTION WHEN duplicate_table THEN
    -- Constraint already exists, ignore
  EXCEPTION WHEN unique_violation THEN
    -- There are duplicate values, let's fix them first
    UPDATE savings_transactions 
    SET transaction_reference = reference_id || '_' || id::text 
    WHERE transaction_reference IN (
      SELECT transaction_reference 
      FROM savings_transactions 
      WHERE transaction_reference IS NOT NULL 
      GROUP BY transaction_reference 
      HAVING COUNT(*) > 1
    );
    -- Now try adding the constraint again
    ALTER TABLE savings_transactions ADD CONSTRAINT savings_transactions_transaction_reference_key UNIQUE (transaction_reference);
  END;
END
$$;

-- Safely add 'deposit' to transaction_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'deposit' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'deposit';
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON savings_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON savings_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON savings_transactions(status);

-- Update the teacher_balances view to include deposits
DROP VIEW IF EXISTS teacher_balances;
CREATE VIEW teacher_balances AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.employee_id,
  u.management_unit,
  COALESCE(SUM(CASE WHEN st.transaction_type IN ('momo', 'controller', 'deposit') THEN st.amount ELSE 0 END), 0) as total_contributions,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'interest' THEN st.amount ELSE 0 END), 0) as total_interest,
  COALESCE(SUM(st.amount), 0) as total_balance,
  MAX(st.transaction_date) as last_transaction_date,
  COUNT(CASE WHEN st.transaction_type = 'deposit' THEN 1 END) as mobile_money_transactions
FROM users u
LEFT JOIN savings_transactions st ON u.id = st.user_id AND st.status = 'completed'
WHERE u.role = 'teacher'
GROUP BY u.id, u.full_name, u.employee_id, u.management_unit;

-- Create function to update transaction status (for webhook processing)
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_reference VARCHAR(255),
  p_status transaction_status,
  p_payment_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE savings_transactions 
  SET 
    status = p_status,
    payment_details = COALESCE(p_payment_details, payment_details),
    updated_at = NOW()
  WHERE transaction_reference = p_transaction_reference 
     OR reference_id = p_transaction_reference;
  
  GET DIAGNOSTICS v_updated = FOUND;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for API access (service role needs to access transactions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_transactions' 
    AND policyname = 'Service role can manage all transactions'
  ) THEN
    CREATE POLICY "Service role can manage all transactions" ON savings_transactions
      FOR ALL 
      USING (current_setting('role') = 'service_role' OR auth.role() = 'service_role');
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, that's fine
END
$$;

-- Add notification_type enum value safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payment_failed' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'payment_failed';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- notification_type doesn't exist, create it
  CREATE TYPE notification_type AS ENUM (
    'payment_success',
    'payment_failed',
    'interest_added',
    'general'
  );
END
$$;

-- Add comments for documentation
COMMENT ON TABLE savings_transactions IS 'Stores all savings transactions including mobile money deposits via Paystack';
COMMENT ON COLUMN savings_transactions.payment_details IS 'JSON object storing Paystack payment information';
COMMENT ON COLUMN savings_transactions.transaction_reference IS 'Unique reference for tracking payments with Paystack';
COMMENT ON COLUMN savings_transactions.payment_method IS 'Payment method used (mobile_money, bank_transfer, etc.)';
COMMENT ON COLUMN savings_transactions.metadata IS 'Additional metadata for the transaction';

-- Show current status
SELECT 'Migration completed successfully. Current transaction counts:' as message;
SELECT 
  status,
  transaction_type,
  COUNT(*) as count
FROM savings_transactions 
GROUP BY status, transaction_type
ORDER BY status, transaction_type;
