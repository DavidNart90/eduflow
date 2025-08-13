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

    // Get recent transactions (last 10)
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('savings_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(10);

    if (transactionsError) {
      // Continue without transactions data
    }

    // Get monthly contribution summary
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: monthlyData, error: monthlyError } = await supabaseAdmin
      .from('savings_transactions')
      .select('amount, transaction_type')
      .eq('user_id', user.id)
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

    // Calculate monthly summary
    const monthlySummary = {
      total: 0,
      momo: 0,
      controller: 0,
      interest: 0,
    };

    if (monthlyData) {
      monthlyData.forEach(transaction => {
        monthlySummary.total += transaction.amount;
        if (transaction.transaction_type in monthlySummary) {
          monthlySummary[
            transaction.transaction_type as keyof typeof monthlySummary
          ] += transaction.amount;
        }
      });
    }

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
      recent_transactions: transactions || [],
      monthly_summary: monthlySummary,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
