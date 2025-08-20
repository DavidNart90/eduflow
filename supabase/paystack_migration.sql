-- Migration to update savings_transactions for Paystack integration
-- This script adds the necessary columns and updates the transaction types

-- Add new columns for Paystack integration
ALTER TABLE savings_transactions 
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mobile_money',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Drop the existing enum type first
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Recreate the enum with all existing and new values
CREATE TYPE transaction_type AS ENUM (
    'momo',       -- Existing value
    'controller', -- Existing value
    'interest',   -- Existing value
    'deposit'     -- New value for mobile money payments
);

-- Re-add the transaction_type column to savings_transactions after enum recreation
ALTER TABLE savings_transactions 
ADD COLUMN transaction_type transaction_type NOT NULL DEFAULT 'deposit';

-- Create index on transaction_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON savings_transactions(transaction_reference);

-- Create index on payment_method for filtering
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON savings_transactions(payment_method);

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

-- Update the add_savings_transaction function to handle new transaction types
CREATE OR REPLACE FUNCTION add_savings_transaction(
  p_user_id UUID,
  p_transaction_type transaction_type,
  p_amount DECIMAL(10,2),
  p_description TEXT,
  p_reference_id VARCHAR(255) DEFAULT NULL,
  p_payment_method VARCHAR(50) DEFAULT 'mobile_money',
  p_payment_details JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Validate user exists and is a teacher
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'teacher') THEN
    RAISE EXCEPTION 'User not found or is not a teacher';
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Insert transaction
  INSERT INTO savings_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    reference_id,
    transaction_reference,
    payment_method,
    payment_details,
    metadata,
    status
  ) VALUES (
    p_user_id, 
    p_transaction_type, 
    p_amount, 
    p_description, 
    p_reference_id,
    p_reference_id, -- Use reference_id as transaction_reference for backward compatibility
    p_payment_method,
    p_payment_details,
    p_metadata,
    'pending' -- Start as pending for mobile money transactions
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

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
  WHERE transaction_reference = p_transaction_reference;
  
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
END
$$;

-- Update notification types to include payment_failed
-- First check if the enum exists and what values it has
DO $$
BEGIN
  -- Check if notification_type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    -- Drop and recreate with new value
    DROP TYPE notification_type CASCADE;
  END IF;
  
  -- Create the enum with all values (adjust these based on your existing values)
  CREATE TYPE notification_type AS ENUM (
    'payment_success',
    'payment_failed',
    'interest_added',
    'general'
  );
END
$$;

-- Add comment for documentation
COMMENT ON TABLE savings_transactions IS 'Stores all savings transactions including mobile money deposits via Paystack';
COMMENT ON COLUMN savings_transactions.payment_details IS 'JSON object storing Paystack payment information';
COMMENT ON COLUMN savings_transactions.transaction_reference IS 'Unique reference for tracking payments with Paystack';
COMMENT ON COLUMN savings_transactions.payment_method IS 'Payment method used (mobile_money, bank_transfer, etc.)';
COMMENT ON COLUMN savings_transactions.metadata IS 'Additional metadata for the transaction';
