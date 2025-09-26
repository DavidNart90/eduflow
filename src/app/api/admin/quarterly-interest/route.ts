import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '../../../../lib/supabase';
import { createInterestPaymentNotification } from '@/lib/notifications';

interface TeacherData {
  teacher_id: string;
  teacher_name: string;
  employee_id: string;
  current_balance: string | number;
  calculated_interest: string | number;
  new_balance: string | number;
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

    // Create a server-side Supabase client
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'calculate') {
      // Calculate interest for all eligible teachers
      const { data: eligibleTeachers, error: calcError } =
        await supabaseAdmin.rpc('get_eligible_teachers_for_interest');

      if (calcError) {
        return NextResponse.json(
          { error: 'Failed to calculate interest' },
          { status: 500 }
        );
      }

      // Get active interest rate
      const { data: activeRate, error: rateError } = await supabaseAdmin.rpc(
        'get_active_interest_rate'
      );

      if (rateError) {
        return NextResponse.json(
          { error: 'Failed to get interest rate' },
          { status: 500 }
        );
      }

      // Calculate totals
      const totalEligibleBalance =
        eligibleTeachers?.reduce(
          (sum: number, teacher: TeacherData) =>
            sum +
            (typeof teacher.current_balance === 'string'
              ? parseFloat(teacher.current_balance)
              : teacher.current_balance || 0),
          0
        ) || 0;

      const totalInterestToPay =
        eligibleTeachers?.reduce(
          (sum: number, teacher: TeacherData) =>
            sum +
            (typeof teacher.calculated_interest === 'string'
              ? parseFloat(teacher.calculated_interest)
              : teacher.calculated_interest || 0),
          0
        ) || 0;

      // Get current quarter info
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      return NextResponse.json({
        success: true,
        calculation: {
          eligible_teachers: eligibleTeachers || [],
          total_eligible_balance: totalEligibleBalance,
          total_interest_to_pay: totalInterestToPay,
          eligible_teachers_count: eligibleTeachers?.length || 0,
          interest_rate: activeRate || 0.0425,
          current_quarter: `Q${currentQuarter}`,
          current_year: currentYear,
          calculation_date: currentDate.toISOString(),
        },
      });
    }

    // Default: Get interest settings and payment history
    const [
      { data: interestSettings },
      { data: paymentHistory },
      { data: activeRate },
    ] = await Promise.all([
      // Get interest settings
      supabaseAdmin
        .from('interest_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

      // Get recent payment history
      supabaseAdmin
        .from('interest_payment_history')
        .select('*')
        .order('payment_year', { ascending: false })
        .order('payment_quarter', { ascending: false })
        .limit(10),

      // Get active interest rate
      supabaseAdmin.rpc('get_active_interest_rate'),
    ]);

    // Get current quarter info
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Check if interest has already been paid this quarter
    const { data: currentQuarterPayment } = await supabaseAdmin
      .from('interest_payments')
      .select('*')
      .eq('payment_year', currentYear)
      .eq('payment_quarter', currentQuarter)
      .single();

    return NextResponse.json({
      success: true,
      settings: {
        interest_rate: activeRate || 0.0425,
        payment_frequency: interestSettings?.payment_frequency || 'quarterly',
        current_quarter: `Q${currentQuarter}`,
        current_year: currentYear,
        is_active: true,
        last_updated: interestSettings?.updated_at || null,
      },
      payment_history: paymentHistory || [],
      current_quarter_paid: Boolean(currentQuarterPayment),
      current_quarter_payment: currentQuarterPayment || null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

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

    const body = await request.json();
    const { action, payment_period, payment_year, payment_quarter, notes } =
      body;

    if (action === 'execute_payment') {
      // Execute interest payment
      try {
        const { data: paymentId, error: execError } = await supabaseAdmin.rpc(
          'execute_interest_payment',
          {
            p_payment_period:
              payment_period || `Q${payment_quarter}-${payment_year}`,
            p_payment_year: payment_year,
            p_payment_quarter: payment_quarter,
            p_executed_by: user.id,
            p_notes:
              notes ||
              'Quarterly interest payment executed via admin dashboard',
          }
        );

        if (execError) {
          return NextResponse.json(
            {
              error: 'Failed to execute interest payment: ' + execError.message,
            },
            { status: 500 }
          );
        }

        // Get the payment details to return
        const { data: paymentDetails } = await supabaseAdmin
          .from('interest_payment_history')
          .select('*')
          .eq('id', paymentId)
          .single();

        // Create notifications for teachers who received interest payments
        try {
          const { data: teacherCalculations, error: calcError } =
            await supabaseAdmin
              .from('teacher_interest_calculations')
              .select(
                `
              teacher_id,
              calculated_interest,
              balance_after_interest,
              users!inner(full_name)
            `
              )
              .eq('interest_payment_id', paymentId);

          if (!calcError && teacherCalculations) {
            // Create notifications for each teacher
            const notificationPromises = teacherCalculations.map(
              (calc: {
                teacher_id: string;
                calculated_interest: number;
                balance_after_interest: number;
                users: { full_name: string };
              }) =>
                createInterestPaymentNotification(
                  calc.teacher_id,
                  {
                    amount: parseFloat(calc.calculated_interest.toString()),
                    payment_period:
                      payment_period || `Q${payment_quarter}-${payment_year}`,
                    new_balance: parseFloat(
                      calc.balance_after_interest.toString()
                    ),
                  },
                  user.id
                )
            );

            await Promise.allSettled(notificationPromises);
          }
        } catch (notificationError) {
          // eslint-disable-next-line no-console
          console.error(
            'Failed to create interest payment notifications:',
            notificationError
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Interest payment executed successfully',
          payment: paymentDetails,
          payment_id: paymentId,
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to execute payment' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
