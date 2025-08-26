import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { TeacherStatementData, calculateRunningBalances } from '@/lib/pdf';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify access (admin or the teacher themselves)
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check access - admin can access any teacher, teachers can only access their own data
    if (userProfile.role !== 'admin' && userProfile.id !== teacherId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch teacher information
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Build date filters
    const dateFilters: Record<string, { transaction_date: string }> = {};
    if (startDate) {
      dateFilters.gte = { transaction_date: startDate };
    }
    if (endDate) {
      dateFilters.lte = { transaction_date: endDate };
    }

    // Fetch transactions
    let transactionQuery = supabase
      .from('savings_transactions')
      .select('*')
      .eq('user_id', teacherId)
      .order('transaction_date', { ascending: true });

    if (startDate) {
      transactionQuery = transactionQuery.gte('transaction_date', startDate);
    }
    if (endDate) {
      transactionQuery = transactionQuery.lte('transaction_date', endDate);
    }

    const { data: transactions, error: transactionError } =
      await transactionQuery;

    if (transactionError) {
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate running balances
    const transactionsWithBalances = calculateRunningBalances(
      transactions || []
    );

    // Calculate balance data
    const completedTransactions = transactionsWithBalances.filter(
      t => t.status === 'completed'
    );
    const totalContributions = completedTransactions
      .filter(t =>
        ['momo', 'controller', 'deposit'].includes(t.transaction_type)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInterest = completedTransactions
      .filter(t => t.transaction_type === 'interest')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = completedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const lastTransactionDate =
      completedTransactions.length > 0
        ? completedTransactions[completedTransactions.length - 1]
            .transaction_date
        : undefined;

    // Fetch interest data
    const { data: interestPayments, error: interestError } = await supabase
      .from('teacher_interest_calculations')
      .select(
        `
        *,
        interest_payments!inner(
          payment_period,
          payment_year,
          payment_quarter,
          execution_date
        )
      `
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (interestError) {
      // Continue without interest data if there's an error
    }

    // Get current interest rate
    const { data: interestSettings } = await supabase
      .from('interest_settings')
      .select('interest_rate')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const currentRate = interestSettings?.[0]?.interest_rate || 0.0425; // Default 4.25%

    // Format interest data
    const quarterlyPayments = (interestPayments || []).map(payment => ({
      quarter: payment.interest_payments.payment_period,
      year: payment.interest_payments.payment_year,
      amount: payment.calculated_interest,
      payment_date: payment.interest_payments.execution_date,
    }));

    // Prepare statement data
    const statementData: TeacherStatementData = {
      teacher: {
        id: teacher.id,
        full_name: teacher.full_name,
        employee_id: teacher.employee_id,
        email: teacher.email,
        management_unit: teacher.management_unit,
        phone_number: teacher.phone_number,
        created_at: teacher.created_at,
      },
      balance: {
        current_balance: currentBalance,
        total_contributions: totalContributions,
        total_interest: totalInterest,
        last_transaction_date: lastTransactionDate,
      },
      transactions: transactionsWithBalances,
      interest: {
        total_interest_earned: totalInterest,
        quarterly_payments: quarterlyPayments,
        current_rate: currentRate,
      },
      statement_period: {
        start_date: startDate || teacher.created_at,
        end_date: endDate || new Date().toISOString(),
      },
      generated_date: new Date().toISOString(),
      generated_by: userProfile.role === 'admin' ? 'Admin' : teacher.full_name,
    };

    return NextResponse.json(statementData);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
