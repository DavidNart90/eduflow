import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// GET /api/teacher/reports - Get teacher's own reports
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Get the teacher's user ID from the database
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', userEmail)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check if user is a teacher (not admin)
    if (dbUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Use admin API for admin users' },
        { status: 403 }
      );
    }

    // Extract query parameters for filtering
    const url = new URL(request.url);
    const reportTypeFilter = url.searchParams.get('report_type');
    const limit = url.searchParams.get('limit');
    const page = url.searchParams.get('page');

    // Build the query for teacher's reports only
    let query = supabaseAdmin
      .from('generated_reports')
      .select(
        `
        *,
        generated_by_user:generated_by (
          full_name,
          employee_id
        )
      `
      )
      .eq('teacher_id', dbUser.id) // Only get reports for this teacher
      .order('created_at', { ascending: false });

    // Apply filters
    if (reportTypeFilter) {
      query = query.eq('report_type', reportTypeFilter);
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit, 10);
      const pageNum = page ? parseInt(page, 10) : 1;
      const offset = (pageNum - 1) * limitNum;
      query = query.range(offset, offset + limitNum - 1);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      // Error fetching teacher reports
      return NextResponse.json(
        {
          error: 'Failed to fetch reports',
          details: reportsError.message || 'Database connection error',
          code: 'FETCH_TEACHER_REPORTS_ERROR',
        },
        { status: 500 }
      );
    }

    // Format the response
    const formattedReports =
      reports?.map(report => ({
        ...report,
        generated_by_name: report.generated_by_user?.full_name || 'System',
        generated_by_employee_id: report.generated_by_user?.employee_id || null,
      })) || [];

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      total: formattedReports.length,
      teacher_id: dbUser.id,
      message: `Found ${formattedReports.length} report(s) for your account`,
    });
  } catch (serverError) {
    // Error in teacher reports API
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          serverError instanceof Error
            ? serverError.message
            : 'Unknown server error',
        code: 'TEACHER_REPORTS_ERROR',
      },
      { status: 500 }
    );
  }
}
