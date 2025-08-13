import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get the current user from the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
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

    // Get system statistics
    const [
      { data: teachers, error: teachersError },
      { data: totalSavings, error: savingsError },
      { data: pendingReports, error: reportsError },
      { data: recentActivities },
    ] = await Promise.all([
      // Get total teachers count
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'teacher'),

      // Get total savings
      supabase.from('teacher_balances').select('total_balance'),

      // Get pending reports count
      supabase
        .from('controller_reports')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),

      // Get recent activities (last 10 transactions)
      supabase
        .from('savings_transactions')
        .select(
          `
          *,
          users!inner(full_name, employee_id)
        `
        )
        .order('transaction_date', { ascending: false })
        .limit(10),
    ]);

    // Calculate total savings
    let totalSavingsAmount = 0;
    if (totalSavings && !savingsError) {
      totalSavingsAmount = totalSavings.reduce(
        (sum, balance) => sum + (balance.total_balance || 0),
        0
      );
    }

    // Get monthly contributions
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: monthlyContributions, error: monthlyError } = await supabase
      .from('savings_transactions')
      .select('amount')
      .gte(
        'transaction_date',
        `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      )
      .lt(
        'transaction_date',
        `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
      );

    let monthlyTotal = 0;
    if (monthlyContributions && !monthlyError) {
      monthlyTotal = monthlyContributions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
    }

    // System health check
    const systemHealth = (() => {
      if (teachersError || savingsError || reportsError) {
        return 'error';
      }
      if (pendingReports && pendingReports.length > 5) {
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
        total_teachers: teachers?.length || 0,
        active_teachers: teachers?.length || 0, // Assuming all teachers are active for now
        total_savings: totalSavingsAmount,
        monthly_contributions: monthlyTotal,
        pending_reports: pendingReports?.length || 0,
        system_health: systemHealth,
      },
      recent_activities: recentActivities || [],
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
