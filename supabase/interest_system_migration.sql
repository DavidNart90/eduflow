-- Interest System Migration
-- This migration adds support for interest calculation and payment system

-- Create table for interest settings
CREATE TABLE IF NOT EXISTS interest_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interest_rate DECIMAL(5,4) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 1), -- Stored as decimal (e.g., 0.0425 for 4.25%)
  payment_frequency VARCHAR(20) NOT NULL DEFAULT 'quarterly', -- 'quarterly', 'semi-annual', 'annual'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for interest payment records
CREATE TABLE IF NOT EXISTS interest_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_period VARCHAR(20) NOT NULL, -- e.g., 'Q1-2025', '2025-H1'
  payment_year INTEGER NOT NULL CHECK (payment_year >= 2020),
  payment_quarter INTEGER CHECK (payment_quarter >= 1 AND payment_quarter <= 4), -- NULL for semi-annual/annual
  interest_rate DECIMAL(5,4) NOT NULL,
  total_eligible_balance DECIMAL(15,2) NOT NULL,
  total_interest_paid DECIMAL(15,2) NOT NULL,
  eligible_teachers_count INTEGER NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'calculated', 'executed', 'failed'
  calculation_date TIMESTAMP WITH TIME ZONE,
  execution_date TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_year, payment_quarter)
);

-- Create table for individual teacher interest calculations
CREATE TABLE IF NOT EXISTS teacher_interest_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interest_payment_id UUID NOT NULL REFERENCES interest_payments(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_before_interest DECIMAL(10,2) NOT NULL,
  calculated_interest DECIMAL(10,2) NOT NULL,
  balance_after_interest DECIMAL(10,2) NOT NULL,
  transaction_id UUID REFERENCES savings_transactions(id), -- Reference to the actual interest transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(interest_payment_id, teacher_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interest_settings_active ON interest_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_interest_payments_period ON interest_payments(payment_year, payment_quarter);
CREATE INDEX IF NOT EXISTS idx_interest_payments_status ON interest_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_teacher_interest_payment ON teacher_interest_calculations(interest_payment_id);
CREATE INDEX IF NOT EXISTS idx_teacher_interest_teacher ON teacher_interest_calculations(teacher_id);

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_interest_settings_updated_at BEFORE UPDATE ON interest_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interest_payments_updated_at BEFORE UPDATE ON interest_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default interest settings (4.25% quarterly)
INSERT INTO interest_settings (interest_rate, payment_frequency, created_by, is_active)
SELECT 0.0425, 'quarterly', u.id, true
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create function to get active interest rate
CREATE OR REPLACE FUNCTION get_active_interest_rate()
RETURNS DECIMAL(5,4) AS $$
DECLARE
  active_rate DECIMAL(5,4);
BEGIN
  SELECT interest_rate INTO active_rate
  FROM interest_settings
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default rate if none set
  RETURN COALESCE(active_rate, 0.0425);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate teacher balance at specific date
CREATE OR REPLACE FUNCTION get_teacher_balance_at_date(
  p_teacher_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM savings_transactions 
     WHERE user_id = p_teacher_id 
       AND status = 'completed'
       AND transaction_date <= p_calculation_date
    ), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate interest for a teacher
CREATE OR REPLACE FUNCTION calculate_teacher_interest(
  p_teacher_id UUID,
  p_interest_rate DECIMAL(5,4),
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  teacher_id UUID,
  current_balance DECIMAL(10,2),
  calculated_interest DECIMAL(10,2),
  new_balance DECIMAL(10,2)
) AS $$
DECLARE
  v_balance DECIMAL(10,2);
  v_interest DECIMAL(10,2);
BEGIN
  -- Get current balance
  v_balance := get_teacher_balance_at_date(p_teacher_id, p_calculation_date);
  
  -- Calculate interest (quarterly rate applied to balance)
  v_interest := ROUND(v_balance * p_interest_rate, 2);
  
  RETURN QUERY SELECT 
    p_teacher_id,
    v_balance,
    v_interest,
    v_balance + v_interest;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all eligible teachers for interest payment
CREATE OR REPLACE FUNCTION get_eligible_teachers_for_interest(
  p_calculation_date DATE DEFAULT CURRENT_DATE,
  p_minimum_balance DECIMAL(10,2) DEFAULT 0.01
)
RETURNS TABLE(
  teacher_id UUID,
  teacher_name VARCHAR(255),
  employee_id VARCHAR(50),
  current_balance DECIMAL(10,2),
  calculated_interest DECIMAL(10,2),
  new_balance DECIMAL(10,2)
) AS $$
DECLARE
  v_interest_rate DECIMAL(5,4);
BEGIN
  -- Get active interest rate
  v_interest_rate := get_active_interest_rate();
  
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.employee_id,
    calc.current_balance,
    calc.calculated_interest,
    calc.new_balance
  FROM users u
  CROSS JOIN LATERAL calculate_teacher_interest(u.id, v_interest_rate, p_calculation_date) calc
  WHERE u.role = 'teacher'
    AND calc.current_balance >= p_minimum_balance
  ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to execute interest payment
CREATE OR REPLACE FUNCTION execute_interest_payment(
  p_payment_period VARCHAR(20),
  p_payment_year INTEGER,
  p_payment_quarter INTEGER DEFAULT NULL,
  p_executed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_interest_rate DECIMAL(5,4);
  v_teacher_record RECORD;
  v_transaction_id UUID;
  v_total_eligible_balance DECIMAL(15,2) := 0;
  v_total_interest_paid DECIMAL(15,2) := 0;
  v_eligible_count INTEGER := 0;
BEGIN
  -- Get active interest rate
  v_interest_rate := get_active_interest_rate();
  
  -- Create interest payment record
  INSERT INTO interest_payments (
    payment_period,
    payment_year,
    payment_quarter,
    interest_rate,
    total_eligible_balance,
    total_interest_paid,
    eligible_teachers_count,
    payment_status,
    calculation_date,
    created_by,
    notes
  ) VALUES (
    p_payment_period,
    p_payment_year,
    p_payment_quarter,
    v_interest_rate,
    0, -- Will be updated
    0, -- Will be updated
    0, -- Will be updated
    'calculated',
    NOW(),
    p_executed_by,
    p_notes
  ) RETURNING id INTO v_payment_id;
  
  -- Process each eligible teacher
  FOR v_teacher_record IN 
    SELECT * FROM get_eligible_teachers_for_interest()
  LOOP
    -- Create interest transaction
    INSERT INTO savings_transactions (
      user_id,
      transaction_type,
      amount,
      description,
      payment_method,
      status,
      transaction_date
    ) VALUES (
      v_teacher_record.teacher_id,
      'interest',
      v_teacher_record.calculated_interest,
      'Quarterly interest payment for ' || p_payment_period,
      'interest',
      'completed',
      CURRENT_DATE
    ) RETURNING id INTO v_transaction_id;
    
    -- Record the calculation
    INSERT INTO teacher_interest_calculations (
      interest_payment_id,
      teacher_id,
      balance_before_interest,
      calculated_interest,
      balance_after_interest,
      transaction_id
    ) VALUES (
      v_payment_id,
      v_teacher_record.teacher_id,
      v_teacher_record.current_balance,
      v_teacher_record.calculated_interest,
      v_teacher_record.new_balance,
      v_transaction_id
    );
    
    -- Update totals
    v_total_eligible_balance := v_total_eligible_balance + v_teacher_record.current_balance;
    v_total_interest_paid := v_total_interest_paid + v_teacher_record.calculated_interest;
    v_eligible_count := v_eligible_count + 1;
  END LOOP;
  
  -- Update payment record with totals
  UPDATE interest_payments 
  SET 
    total_eligible_balance = v_total_eligible_balance,
    total_interest_paid = v_total_interest_paid,
    eligible_teachers_count = v_eligible_count,
    payment_status = 'executed',
    execution_date = NOW(),
    executed_by = p_executed_by,
    updated_at = NOW()
  WHERE id = v_payment_id;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for interest payment history
CREATE OR REPLACE VIEW interest_payment_history AS
SELECT 
  ip.id,
  ip.payment_period,
  ip.payment_year,
  ip.payment_quarter,
  ip.interest_rate,
  ip.total_eligible_balance,
  ip.total_interest_paid,
  ip.eligible_teachers_count,
  ip.payment_status,
  ip.calculation_date,
  ip.execution_date,
  executor.full_name as executed_by_name,
  creator.full_name as created_by_name,
  ip.notes,
  ip.created_at
FROM interest_payments ip
LEFT JOIN users executor ON ip.executed_by = executor.id
LEFT JOIN users creator ON ip.created_by = creator.id
ORDER BY ip.payment_year DESC, ip.payment_quarter DESC;

-- RLS Policies for interest tables
ALTER TABLE interest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_interest_calculations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage interest settings
CREATE POLICY "Admins can manage interest settings" ON interest_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- Only admins can manage interest payments
CREATE POLICY "Admins can manage interest payments" ON interest_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- Teachers can view their own interest calculations, admins can view all
CREATE POLICY "Users can view relevant interest calculations" ON teacher_interest_calculations
  FOR SELECT USING (
    teacher_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- Only admins can insert/update interest calculations
CREATE POLICY "Admins can manage interest calculations" ON teacher_interest_calculations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE interest_settings IS 'Stores interest rate configuration for the savings association';
COMMENT ON TABLE interest_payments IS 'Records of interest payment periods and their execution';
COMMENT ON TABLE teacher_interest_calculations IS 'Individual teacher interest calculations and payments';

COMMENT ON FUNCTION get_active_interest_rate() IS 'Returns the currently active interest rate';
COMMENT ON FUNCTION calculate_teacher_interest(UUID, DECIMAL, DATE) IS 'Calculates interest for a specific teacher';
COMMENT ON FUNCTION get_eligible_teachers_for_interest(DATE, DECIMAL) IS 'Returns all teachers eligible for interest payment';
COMMENT ON FUNCTION execute_interest_payment(VARCHAR, INTEGER, INTEGER, UUID, TEXT) IS 'Executes interest payment for all eligible teachers';

-- Show migration completion status
SELECT 'Interest system migration completed successfully!' as message;