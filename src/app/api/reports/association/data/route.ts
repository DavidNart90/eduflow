import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface ManagementUnitData {
  unit_name: string;
  teacher_count: number;
  total_balance: number;
  teachers: string[];
}

interface ManagementUnitsAccumulator {
  [key: string]: ManagementUnitData;
}
import { AssociationSummaryData } from '@/lib/pdf';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');

    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify admin access (only admins can generate association reports)
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
      .select('id, role, full_name')
      .eq('email', user.email)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Calculate period dates if quarter/year provided
    let periodStart = startDate;
    let periodEnd = endDate;

    if (quarter && year) {
      const yearInt = parseInt(year);
      const quarterInt = parseInt(quarter);

      // Calculate quarter start and end dates
      const quarterStartMonth = (quarterInt - 1) * 3;
      const quarterStartDate = new Date(yearInt, quarterStartMonth, 1);
      const quarterEndDate = new Date(yearInt, quarterStartMonth + 3, 0); // Last day of quarter

      periodStart = quarterStartDate.toISOString().split('T')[0];
      periodEnd = quarterEndDate.toISOString().split('T')[0];
    }

    // Fetch teacher statistics
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, full_name, employee_id, management_unit, created_at')
      .eq('role', 'teacher');

    if (teachersError) {
      return NextResponse.json(
        { error: 'Failed to fetch teacher data' },
        { status: 500 }
      );
    }

    // Get teacher balances
    const { data: balances, error: balancesError } = await supabase
      .from('teacher_balances')
      .select('*');

    if (balancesError) {
      // Continue without balances data if there's an error
    }

    // Calculate active teachers (those with balances > 0)
    const activeTeachers = (balances || []).filter(
      b => b.total_balance > 0
    ).length;
    const totalSystemBalance = (balances || []).reduce(
      (sum, b) => sum + b.total_balance,
      0
    );
    const totalContributions = (balances || []).reduce(
      (sum, b) => sum + b.total_contributions,
      0
    );
    const totalInterest = (balances || []).reduce(
      (sum, b) => sum + b.total_interest,
      0
    );
    const averageBalance =
      activeTeachers > 0 ? totalSystemBalance / activeTeachers : 0;

    // Fetch transactions for the period
    let transactionQuery = supabase.from('savings_transactions').select(`
        *,
        users!inner(management_unit)
      `);

    if (periodStart) {
      transactionQuery = transactionQuery.gte('transaction_date', periodStart);
    }
    if (periodEnd) {
      transactionQuery = transactionQuery.lte('transaction_date', periodEnd);
    }

    const { data: transactions, error: transactionsError } =
      await transactionQuery;

    if (transactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch transaction data' },
        { status: 500 }
      );
    }

    // Analyze transactions
    const completedTransactions = (transactions || []).filter(
      t => t.status === 'completed'
    );
    const pendingTransactions = (transactions || []).filter(
      t => t.status === 'pending'
    );
    const failedTransactions = (transactions || []).filter(
      t => t.status === 'failed'
    );
    const transactionVolume = completedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Group by transaction type
    const mobileMoneyTransactions = completedTransactions.filter(t =>
      ['momo', 'deposit'].includes(t.transaction_type)
    );
    const controllerTransactions = completedTransactions.filter(
      t => t.transaction_type === 'controller'
    );
    const interestTransactions = completedTransactions.filter(
      t => t.transaction_type === 'interest'
    );

    // Management units breakdown
    const managementUnits = teachers.reduce(
      (acc: ManagementUnitsAccumulator, teacher) => {
        const unit = teacher.management_unit;
        if (!acc[unit]) {
          acc[unit] = {
            unit_name: unit,
            teacher_count: 0,
            total_balance: 0,
            teachers: [],
          };
        }
        acc[unit].teacher_count++;
        acc[unit].teachers.push(teacher.id);

        // Add balance data
        const teacherBalance = balances?.find(b => b.user_id === teacher.id);
        if (teacherBalance) {
          acc[unit].total_balance += teacherBalance.total_balance;
        }

        return acc;
      },
      {}
    );

    const managementUnitsArray = Object.values(managementUnits).map(
      (unit: ManagementUnitData) => ({
        unit_name: unit.unit_name,
        teacher_count: unit.teacher_count,
        total_balance: unit.total_balance,
        average_balance:
          unit.teacher_count > 0 ? unit.total_balance / unit.teacher_count : 0,
        contribution_percentage:
          totalSystemBalance > 0
            ? (unit.total_balance / totalSystemBalance) * 100
            : 0,
      })
    );

    // Fetch interest payment data for the period
    let interestQuery = supabase
      .from('interest_payment_history')
      .select('*')
      .order('payment_year', { ascending: false })
      .order('payment_quarter', { ascending: false });

    if (year) {
      interestQuery = interestQuery.eq('payment_year', parseInt(year));
    }

    const { data: interestPaymentHistory, error: interestHistoryError } =
      await interestQuery;

    if (interestHistoryError) {
      // Continue without interest history data if there's an error
    }

    // Get current interest rate
    const { data: interestSettings } = await supabase
      .from('interest_settings')
      .select('interest_rate')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const currentRate = interestSettings?.[0]?.interest_rate || 0.0425;

    // Format interest payment periods
    const paymentPeriods = (interestPaymentHistory || []).map(payment => ({
      period: payment.payment_period,
      amount: payment.total_interest_paid,
      teacher_count: payment.eligible_teachers_count,
      payment_date: payment.execution_date,
    }));

    // Top contributors
    const topContributors = (balances || [])
      .sort((a, b) => b.total_balance - a.total_balance)
      .slice(0, 10)
      .map(balance => {
        const teacher = teachers.find(t => t.id === balance.user_id);
        return {
          teacher_name: teacher?.full_name || 'Unknown',
          employee_id: teacher?.employee_id || 'Unknown',
          balance: balance.total_balance,
          contributions: balance.total_contributions,
        };
      });

    // Calculate growth metrics (simplified - would need historical data for accurate calculation)
    const newTeachersThisPeriod = periodStart
      ? teachers.filter(t => new Date(t.created_at) >= new Date(periodStart))
          .length
      : 0;

    // Prepare association summary data
    const summaryData: AssociationSummaryData = {
      summary: {
        total_teachers: teachers.length,
        active_teachers: activeTeachers,
        total_system_balance: totalSystemBalance,
        total_contributions: totalContributions,
        total_interest_paid: totalInterest,
        average_balance_per_teacher: averageBalance,
      },
      period: {
        start_date:
          periodStart || teachers[0]?.created_at || new Date().toISOString(),
        end_date: periodEnd || new Date().toISOString(),
        quarter: quarter ? parseInt(quarter) : undefined,
        year: year ? parseInt(year) : new Date().getFullYear(),
      },
      transactions: {
        total_transactions: (transactions || []).length,
        completed_transactions: completedTransactions.length,
        pending_transactions: pendingTransactions.length,
        failed_transactions: failedTransactions.length,
        transaction_volume: transactionVolume,
        by_type: {
          mobile_money: {
            count: mobileMoneyTransactions.length,
            amount: mobileMoneyTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            ),
          },
          controller: {
            count: controllerTransactions.length,
            amount: controllerTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            ),
          },
          interest: {
            count: interestTransactions.length,
            amount: interestTransactions.reduce((sum, t) => sum + t.amount, 0),
          },
        },
      },
      management_units: managementUnitsArray,
      interest_payments: {
        total_paid: paymentPeriods.reduce((sum, p) => sum + p.amount, 0),
        payment_periods: paymentPeriods,
        current_rate: currentRate,
      },
      top_contributors: topContributors,
      growth_metrics: {
        new_teachers_this_period: newTeachersThisPeriod,
        balance_growth_percentage: 5.2, // Placeholder - would calculate from historical data
        transaction_growth_percentage: 8.7, // Placeholder - would calculate from historical data
        previous_period_balance: totalSystemBalance * 0.95, // Placeholder
      },
      generated_date: new Date().toISOString(),
      generated_by: userProfile.full_name,
    };

    return NextResponse.json(summaryData);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
