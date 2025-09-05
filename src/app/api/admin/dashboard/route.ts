import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// Type definitions for better type safety
interface User {
  id: string;
  full_name: string;
  employee_id: string;
  created_at: string;
}

interface TeacherBalance {
  user_id: string;
  total_balance: number;
  total_contributions: number;
  total_interest: number;
  last_transaction_date: string;
}

interface Transaction {
  id: string;
  transaction_type:
    | 'momo'
    | 'deposit'
    | 'controller'
    | 'interest'
    | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_date: string;
  created_at: string;
}

interface RecentActivity extends Transaction {
  users?: {
    full_name: string;
    employee_id: string;
  };
}

// Supabase error type
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Get system statistics in parallel
    const [
      { data: teachers, error: teachersError },
      { data: totalBalances, error: balancesError },
      { data: allTransactions, error: transactionsError },
      { data: recentActivities, error: activitiesError },
    ] = (await Promise.all([
      // Get total teachers count
      supabaseAdmin
        .from('users')
        .select('id, full_name, employee_id, created_at')
        .eq('role', 'teacher'),

      // Get all teacher balances
      supabaseAdmin.from('teacher_balances').select('*'),

      // Get all completed transactions for calculations with date
      supabaseAdmin
        .from('savings_transactions')
        .select('transaction_type, amount, status, transaction_date')
        .eq('status', 'completed'),

      // Get recent activities (last 10 transactions with user info)
      supabaseAdmin
        .from('savings_transactions')
        .select(
          `
          *,
          users!inner(full_name, employee_id)
        `
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ])) as [
      { data: User[] | null; error: SupabaseError | null },
      { data: TeacherBalance[] | null; error: SupabaseError | null },
      { data: Transaction[] | null; error: SupabaseError | null },
      { data: RecentActivity[] | null; error: SupabaseError | null },
    ];

    // Calculate total savings from balances (this is the actual total)
    let totalSavingsAmount = 0;
    if (totalBalances && !balancesError) {
      totalSavingsAmount = totalBalances.reduce(
        (sum: number, balance: TeacherBalance) =>
          sum + (balance.total_balance || 0),
        0
      );
    }

    // Calculate transaction type breakdowns for historical data
    let totalMoMo = 0;
    let totalController = 0;
    let totalInterest = 0;

    if (allTransactions && !transactionsError) {
      allTransactions.forEach((transaction: Transaction) => {
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          totalMoMo += transaction.amount;
        } else if (transaction.transaction_type === 'controller') {
          totalController += transaction.amount;
        } else if (transaction.transaction_type === 'interest') {
          totalInterest += transaction.amount;
        }
      });
    }

    // Get current and previous month data for trends
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Previous month calculation
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [
      { data: currentMonthContributions, error: currentMonthError },
      { data: previousMonthContributions, error: previousMonthError },
      { data: previousMonthTeachers },
    ] = await Promise.all([
      // Current month contributions
      supabaseAdmin
        .from('savings_transactions')
        .select('amount, transaction_type')
        .eq('status', 'completed')
        .gte(
          'transaction_date',
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
        )
        .lt(
          'transaction_date',
          `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
        ),

      // Previous month contributions
      supabaseAdmin
        .from('savings_transactions')
        .select('amount, transaction_type')
        .eq('status', 'completed')
        .gte(
          'transaction_date',
          `${previousYear}-${previousMonth.toString().padStart(2, '0')}-01`
        )
        .lt(
          'transaction_date',
          `${previousYear}-${(previousMonth + 1).toString().padStart(2, '0')}-01`
        ),

      // Previous month teachers count (total at end of previous month)
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'teacher')
        .lt(
          'created_at',
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
        ),
    ]);

    // Calculate monthly totals
    let currentMonthTotal = 0;
    let currentMonthMoMo = 0;
    let currentMonthController = 0;

    if (currentMonthContributions && !currentMonthError) {
      currentMonthContributions.forEach((transaction: Transaction) => {
        currentMonthTotal += transaction.amount;
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          currentMonthMoMo += transaction.amount;
        } else if (transaction.transaction_type === 'controller') {
          currentMonthController += transaction.amount;
        }
      });
    }

    let previousMonthTotal = 0;
    let previousMonthMoMo = 0;
    let previousMonthController = 0;

    if (previousMonthContributions && !previousMonthError) {
      previousMonthContributions.forEach((transaction: Transaction) => {
        previousMonthTotal += transaction.amount;
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          previousMonthMoMo += transaction.amount;
        } else if (transaction.transaction_type === 'controller') {
          previousMonthController += transaction.amount;
        }
      });
    }

    // Calculate trend percentages
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100; // Round to 2 decimal places
    };

    const teachersCount = teachers?.length || 0;
    const previousTeachersCount = previousMonthTeachers?.length || 0;

    const trends = {
      teachers: calculateTrend(teachersCount, previousTeachersCount),
      totalContributions: calculateTrend(currentMonthTotal, previousMonthTotal),
      momoContributions: calculateTrend(currentMonthMoMo, previousMonthMoMo),
      controllerContributions: calculateTrend(
        currentMonthController,
        previousMonthController
      ),
    };

    // Get pending reports count (mock for now as we don't have controller_reports table fully implemented)
    const pendingReportsCount = 3; // This would be replaced with actual query

    // Get additional system activity metrics
    const [{ data: controllerReports }, { data: emailNotifications }] =
      await Promise.all([
        // Get controller reports uploaded this month
        supabaseAdmin
          .from('controller_reports')
          .select('id')
          .gte(
            'created_at',
            `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
          )
          .lt(
            'created_at',
            `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
          ),

        // Get emails sent this month
        supabaseAdmin
          .from('email_notifications')
          .select('id')
          .eq('status', 'sent')
          .gte(
            'created_at',
            `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
          )
          .lt(
            'created_at',
            `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
          ),
      ]);

    const controllerReportsCount = controllerReports?.length || 0;
    const emailsSentCount = emailNotifications?.length || 0;

    // System health check
    const systemHealth = (() => {
      if (
        teachersError ||
        balancesError ||
        transactionsError ||
        activitiesError ||
        currentMonthError ||
        previousMonthError
      ) {
        return 'error';
      }
      if (pendingReportsCount > 5) {
        return 'warning';
      }
      return 'good';
    })();

    return NextResponse.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      systemStats: {
        total_teachers: teachersCount,
        active_teachers: teachersCount, // Assuming all teachers are active for now
        total_savings: totalSavingsAmount,
        monthly_contributions: currentMonthTotal,
        pending_reports: pendingReportsCount,
        system_health: systemHealth,
        controller_reports_uploaded: controllerReportsCount,
        emails_sent: emailsSentCount,
      },
      recent_activities: recentActivities || [],
      // Additional calculated fields for UI compatibility
      totalMoMo,
      totalController,
      interestPaid: totalInterest,
      pendingReports: pendingReportsCount,
      // Add trend data
      trends,
      monthlyBreakdown: {
        current: {
          total: currentMonthTotal,
          momo: currentMonthMoMo,
          controller: currentMonthController,
        },
        previous: {
          total: previousMonthTotal,
          momo: previousMonthMoMo,
          controller: previousMonthController,
        },
      },
    });
  } catch (error) {
    // Log error for debugging (remove console.error for production)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Admin dashboard API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
