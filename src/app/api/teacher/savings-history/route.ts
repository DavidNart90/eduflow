import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

interface TransactionWithBalance {
  id: string;
  user_id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
  status: string;
  transaction_reference?: string;
  created_at: string;
  runningBalance: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    // Get teacher balance using the view for summary data
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('teacher_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (balanceError) {
      // Continue without balance data
    }

    // Build the base query for transactions
    let query = supabaseAdmin
      .from('savings_transactions')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (source && source !== 'all') {
      // Handle transaction type filtering - include both 'momo' and 'deposit' for mobile money
      if (source === 'momo') {
        query = query.in('transaction_type', ['momo', 'deposit']);
      } else {
        query = query.eq('transaction_type', source);
      }
    }

    // Get total count for pagination
    const countQuery = supabaseAdmin
      .from('savings_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Apply the same filters to count query
    if (startDate) {
      countQuery.gte('created_at', startDate);
    }

    if (endDate) {
      countQuery.lte('created_at', endDate);
    }

    if (source && source !== 'all') {
      if (source === 'momo') {
        countQuery.in('transaction_type', ['momo', 'deposit']);
      } else {
        countQuery.eq('transaction_type', source);
      }
    }

    const { count: totalCount } = await countQuery;

    // Get paginated transactions
    const offset = (page - 1) * limit;
    const { data: transactions, error: transactionsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate running balance for transactions
    // Simple approach: for each transaction, calculate the cumulative balance up to that point
    const transactionsWithBalance: TransactionWithBalance[] = [];

    if (transactions && transactions.length > 0) {
      // Get all transactions for this user to calculate accurate running balances
      const { data: allUserTransactions } = await supabaseAdmin
        .from('savings_transactions')
        .select('id, amount, transaction_date, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('transaction_date', { ascending: true });

      // Create a map of transaction balances
      const balanceMap = new Map<string, number>();
      let runningBalance = 0;

      if (allUserTransactions) {
        allUserTransactions.forEach(tx => {
          runningBalance += tx.amount;
          balanceMap.set(tx.id, runningBalance);
        });
      }

      // Apply the calculated balances to our paginated transactions
      transactions.forEach(transaction => {
        const balance = balanceMap.get(transaction.id) || 0;
        transactionsWithBalance.push({
          ...transaction,
          runningBalance: balance,
        });
      });
    } // Calculate summary statistics
    const summaryStats = {
      totalBalance: balanceData?.total_balance || 0,
      totalMomoContributions: 0,
      totalControllerContributions: 0,
      interestEarned: 0,
    };

    // Get all-time statistics for completed transactions
    const { data: allTransactions } = await supabaseAdmin
      .from('savings_transactions')
      .select('amount, transaction_type')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (allTransactions) {
      allTransactions.forEach(transaction => {
        if (
          transaction.transaction_type === 'momo' ||
          transaction.transaction_type === 'deposit'
        ) {
          summaryStats.totalMomoContributions += transaction.amount;
        } else if (transaction.transaction_type === 'controller') {
          summaryStats.totalControllerContributions += transaction.amount;
        } else if (transaction.transaction_type === 'interest') {
          summaryStats.interestEarned += transaction.amount;
        }
      });
    }

    // Format transactions for frontend
    const formattedTransactions = transactionsWithBalance.map(transaction => {
      let description = 'Transaction';

      // Generate description based on transaction type
      switch (transaction.transaction_type) {
        case 'momo':
        case 'deposit':
          description = 'Mobile Money Deposit';
          break;
        case 'controller':
          description = 'Controller Deduction';
          break;
        case 'interest':
          description = 'Interest Payment';
          break;
        case 'withdrawal':
          description = 'Withdrawal';
          break;
        default:
          description = 'Transaction';
      }

      // Add reference if available
      if (transaction.transaction_reference) {
        description += ` (${transaction.transaction_reference})`;
      }

      return {
        id: transaction.id,
        date: new Date(transaction.transaction_date).toLocaleDateString(
          'en-US',
          {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }
        ),
        description,
        source:
          transaction.transaction_type === 'deposit'
            ? 'momo'
            : transaction.transaction_type,
        amount:
          transaction.transaction_type === 'withdrawal'
            ? -transaction.amount
            : transaction.amount,
        runningBalance: transaction.runningBalance,
        status: transaction.status,
        createdAt: transaction.created_at,
      };
    });

    // Apply search filter to formatted transactions if needed
    let filteredTransactions = formattedTransactions;
    if (search) {
      filteredTransactions = formattedTransactions.filter(transaction =>
        transaction.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      summary: summaryStats,
      transactions: filteredTransactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((totalCount || 0) / limit),
        totalItems: totalCount || 0,
        itemsPerPage: limit,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
