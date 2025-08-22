import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Verify the token with the regular Supabase client
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        userEmail = user.email;
      } catch {
        return NextResponse.json(
          { error: 'Token verification failed' },
          { status: 401 }
        );
      }
    } else {
      // Fallback: try to get session from cookies
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        userEmail = session.user.email;
      } catch {
        return NextResponse.json(
          { error: 'Session retrieval failed' },
          { status: 401 }
        );
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create a server-side Supabase client with service role for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      );
    }

    // Get teacher balance using the view
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('teacher_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (balanceError) {
      // Continue without balance data
    }

    // Get recent transactions (last 5) - all statuses for transaction history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('savings_transactions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'completed', 'failed']) // Include all statuses
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactionsError) {
      // Continue without transactions data
    }

    // Calculate running balance for recent transactions
    let runningBalance = balanceData?.total_balance || 0;
    const transactionsWithBalance = (transactions || []).map(transaction => {
      const transactionWithBalance = {
        ...transaction,
        balance: runningBalance,
      };
      // For the next transaction (going backwards), subtract this transaction
      runningBalance -= transaction.amount;
      return transactionWithBalance;
    });

    // Get monthly contribution summary
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month data with completed transactions only
    const { data: monthlyData, error: monthlyError } = await supabaseAdmin
      .from('savings_transactions')
      .select('amount, transaction_type, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte(
        'transaction_date',
        `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      )
      .lt(
        'transaction_date',
        `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
      );

    if (monthlyError) {
      // Continue without monthly data
    }

    // Get previous month data for trend calculation
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const { data: previousMonthData, error: previousMonthError } =
      await supabaseAdmin
        .from('savings_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte(
          'transaction_date',
          `${previousYear}-${previousMonth.toString().padStart(2, '0')}-01`
        )
        .lt(
          'transaction_date',
          `${previousYear}-${(previousMonth + 1).toString().padStart(2, '0')}-01`
        );

    if (previousMonthError) {
      // Continue without previous month data
    }

    // Calculate monthly summary
    const monthlySummary = {
      total: 0,
      momo: 0,
      controller: 0,
      interest: 0,
      contributionCount: 0,
    };

    // Calculate total contributions (excluding interest) and count
    if (monthlyData) {
      monthlyData.forEach(transaction => {
        monthlySummary.total += transaction.amount;

        // Handle transaction types - treat 'deposit' as 'momo' for backward compatibility
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          monthlySummary.momo += transaction.amount;
          monthlySummary.contributionCount++;
        } else if (transaction.transaction_type === 'controller') {
          monthlySummary.controller += transaction.amount;
          monthlySummary.contributionCount++;
        } else if (transaction.transaction_type === 'interest') {
          monthlySummary.interest += transaction.amount;
          // Don't count interest as a contribution
        }
      });
    }

    // Calculate previous month total for trend
    let previousMonthTotal = 0;
    if (previousMonthData) {
      previousMonthTotal = previousMonthData.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
    }

    // Calculate trend percentage
    let trendPercentage = 0;
    if (previousMonthTotal > 0) {
      trendPercentage =
        ((monthlySummary.total - previousMonthTotal) / previousMonthTotal) *
        100;
    } else if (monthlySummary.total > 0) {
      trendPercentage = 100; // First month with contributions
    }

    // Get total contributions breakdown (all time) - include both momo and deposit for backward compatibility
    const { data: totalContributionsData } = await supabaseAdmin
      .from('savings_transactions')
      .select('amount, transaction_type')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .in('transaction_type', ['momo', 'controller', 'deposit', 'interest']);

    const totalContributionBreakdown = {
      total: 0,
      momo: 0,
      controller: 0,
      interest: 0,
      count: 0,
    };

    if (totalContributionsData) {
      totalContributionsData.forEach(transaction => {
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          totalContributionBreakdown.momo += transaction.amount;
          totalContributionBreakdown.total += transaction.amount;
          totalContributionBreakdown.count++;
        } else if (transaction.transaction_type === 'controller') {
          totalContributionBreakdown.controller += transaction.amount;
          totalContributionBreakdown.total += transaction.amount;
          totalContributionBreakdown.count++;
        } else if (transaction.transaction_type === 'interest') {
          totalContributionBreakdown.interest += transaction.amount;
          // Interest adds to total but doesn't count as a contribution
        }
      });
    }

    // Get the current active interest setting
    const { data: interestSetting } = await supabaseAdmin
      .from('interest_settings')
      .select('interest_rate, payment_frequency')
      .eq('is_active', true)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        employee_id: user.employee_id,
        management_unit: user.management_unit,
        email: user.email,
        phone_number: user.phone_number,
      },
      balance: balanceData?.total_balance || 0,
      recent_transactions: transactionsWithBalance,
      monthly_summary: monthlySummary,
      trend_percentage: trendPercentage,
      current_month_year: {
        month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
        year: currentYear,
      },
      total_contributions: {
        ...totalContributionBreakdown,
        total:
          totalContributionBreakdown.total +
          totalContributionBreakdown.interest,
      },
      interest_setting: {
        interest_rate: interestSetting?.interest_rate || 0.0425, // Default 4.25%
        payment_frequency: interestSetting?.payment_frequency || 'quarterly',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
