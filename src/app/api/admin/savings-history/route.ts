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

    // Create a server-side Supabase client
    const supabaseAdmin = createServerSupabaseClient();

    // Get user profile and verify admin role
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const transactionType = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const paymentMethod = searchParams.get('paymentMethod') || 'all';
    const dateRange = searchParams.get('dateRange') || '30';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabaseAdmin
      .from('savings_transactions')
      .select(
        `
        *,
        users!inner(
          full_name,
          employee_id,
          management_unit
        )
      `
      )
      .order('created_at', { ascending: false });

    let countQuery = supabaseAdmin
      .from('savings_transactions')
      .select('id', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      const searchFilter = `users.full_name.ilike.%${search}%,users.employee_id.ilike.%${search}%`;
      query = query.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply transaction type filter
    if (transactionType !== 'all') {
      query = query.eq('transaction_type', transactionType);
      countQuery = countQuery.eq('transaction_type', transactionType);
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }

    // Apply payment method filter
    if (paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
      countQuery = countQuery.eq('payment_method', paymentMethod);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const dateFilter = startDate.toISOString().split('T')[0];

      query = query.gte('transaction_date', dateFilter);
      countQuery = countQuery.gte('transaction_date', dateFilter);
    }

    // Execute queries in parallel
    const [
      { data: transactions, error: transactionsError },
      { count: totalCount, error: countError },
    ] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery,
    ]);

    if (transactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to count transactions' },
        { status: 500 }
      );
    }

    // Calculate summary statistics with the same filters
    let summaryQuery = supabaseAdmin.from('savings_transactions').select(`
        transaction_type, 
        amount, 
        status,
        users!inner(full_name, employee_id)
      `);

    // Apply the same filters to summary
    if (search) {
      const searchFilter = `users.full_name.ilike.%${search}%,users.employee_id.ilike.%${search}%`;
      summaryQuery = summaryQuery.or(searchFilter);
    }

    if (transactionType !== 'all') {
      summaryQuery = summaryQuery.eq('transaction_type', transactionType);
    }

    if (status !== 'all') {
      summaryQuery = summaryQuery.eq('status', status);
    }

    if (paymentMethod !== 'all') {
      summaryQuery = summaryQuery.eq('payment_method', paymentMethod);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const dateFilter = startDate.toISOString().split('T')[0];

      summaryQuery = summaryQuery.gte('transaction_date', dateFilter);
    }

    const { data: summaryData, error: summaryError } = await summaryQuery;

    if (summaryError) {
      return NextResponse.json(
        { error: 'Failed to fetch summary' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalCount || 0,
      totalAmount: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      mobileMoneyTotal: 0,
      controllerTotal: 0,
      interestTotal: 0,
    };

    if (summaryData) {
      summaryData.forEach(transaction => {
        // Only count completed transactions toward total amount
        if (transaction.status === 'completed') {
          summary.totalAmount += transaction.amount;
        }

        switch (transaction.status) {
          case 'completed':
            summary.completedTransactions++;
            break;
          case 'pending':
            summary.pendingTransactions++;
            break;
          case 'failed':
            summary.failedTransactions++;
            break;
          default:
            // Handle unknown status
            break;
        }

        if (transaction.status === 'completed') {
          switch (transaction.transaction_type) {
            case 'momo':
            case 'deposit':
              summary.mobileMoneyTotal += transaction.amount;
              break;
            case 'controller':
              summary.controllerTotal += transaction.amount;
              break;
            case 'interest':
              summary.interestTotal += transaction.amount;
              break;
            default:
              // Handle unknown transaction type
              break;
          }
        }
      });
    }

    return NextResponse.json({
      transactions: transactions || [],
      summary,
      totalCount: totalCount || 0,
      currentPage: page,
      totalPages: Math.ceil((totalCount || 0) / limit),
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
