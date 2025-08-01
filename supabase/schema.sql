-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'admin');
CREATE TYPE transaction_type AS ENUM ('momo', 'controller', 'interest');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE report_status AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE notification_type AS ENUM ('statement', 'payment_confirmation', 'system');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'teacher',
  management_unit VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Savings transactions table
CREATE TABLE savings_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status transaction_status NOT NULL DEFAULT 'pending',
  reference_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Controller reports table
CREATE TABLE controller_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2020),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  status report_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_month, report_year)
);

-- Email notifications table
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status notification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX idx_transactions_date ON savings_transactions(transaction_date);
CREATE INDEX idx_transactions_type ON savings_transactions(transaction_type);
CREATE INDEX idx_transactions_status ON savings_transactions(status);
CREATE INDEX idx_reports_month_year ON controller_reports(report_month, report_year);
CREATE INDEX idx_reports_status ON controller_reports(status);
CREATE INDEX idx_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_notifications_status ON email_notifications(status);

-- Create teacher balances view
CREATE VIEW teacher_balances AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.employee_id,
  u.management_unit,
  COALESCE(SUM(CASE WHEN st.transaction_type IN ('momo', 'controller') THEN st.amount ELSE 0 END), 0) as total_contributions,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'interest' THEN st.amount ELSE 0 END), 0) as total_interest,
  COALESCE(SUM(st.amount), 0) as total_balance,
  MAX(st.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN savings_transactions st ON u.id = st.user_id AND st.status = 'completed'
WHERE u.role = 'teacher'
GROUP BY u.id, u.full_name, u.employee_id, u.management_unit;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON savings_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON controller_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate teacher balance
CREATE OR REPLACE FUNCTION get_teacher_balance(teacher_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM savings_transactions 
     WHERE user_id = teacher_id AND status = 'completed'), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to add transaction with balance validation
CREATE OR REPLACE FUNCTION add_savings_transaction(
  p_user_id UUID,
  p_transaction_type transaction_type,
  p_amount DECIMAL(10,2),
  p_description TEXT,
  p_reference_id VARCHAR(255) DEFAULT NULL
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
    status
  ) VALUES (
    p_user_id, 
    p_transaction_type, 
    p_amount, 
    p_description, 
    p_reference_id,
    'completed'
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE controller_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON savings_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON savings_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert transactions" ON savings_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reports policies
CREATE POLICY "Admins can manage reports" ON controller_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications" ON email_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample admin user (password will be set via Supabase Auth)
INSERT INTO users (employee_id, email, full_name, role, management_unit) 
VALUES ('ADMIN001', 'admin@eduflow.com', 'System Administrator', 'admin', 'System')
ON CONFLICT (employee_id) DO NOTHING; 