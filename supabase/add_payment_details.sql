-- Add payment_details column to savings_transactions table for storing Paystack payment information
ALTER TABLE savings_transactions 
ADD COLUMN payment_details JSONB,
ADD COLUMN transaction_reference VARCHAR(255) UNIQUE;
