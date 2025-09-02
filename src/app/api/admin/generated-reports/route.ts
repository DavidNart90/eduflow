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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Check if user is admin
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single();

    if (dbUserError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get generated reports with teacher information
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('generated_reports')
      .select(
        `
        *,
        teacher:teacher_id (
          full_name
        )
      `
      )
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching generated reports:', reportsError);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedReports =
      reports?.map(report => ({
        ...report,
        teacher_name: report.teacher?.full_name || null,
      })) || [];

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      total: formattedReports.length,
    });
  } catch (error) {
    console.error('Error in generated reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
