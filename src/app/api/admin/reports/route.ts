import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/admin/reports - Get all reports
export async function GET(request: NextRequest) {
  try {
    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify admin access
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get reports from database
    const { data: reports, error: reportsError } = await supabase
      .from('generated_reports')
      .select(
        `
        *,
        teacher:teacher_id (
          id,
          full_name,
          employee_id,
          email
        ),
        generated_by_user:generated_by (
          id,
          full_name,
          employee_id,
          email
        )
      `
      )
      .order('created_at', { ascending: false });

    if (reportsError) {
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: reportsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      count: reports?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify admin access
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { report_type, teacher_id, file_name, generation_params } = body;

    // Validate required fields
    if (!report_type || !file_name) {
      return NextResponse.json(
        { error: 'Missing required fields: report_type, file_name' },
        { status: 400 }
      );
    }

    // Create the report entry
    const { data: report, error: createError } = await supabase
      .from('generated_reports')
      .insert({
        report_type,
        teacher_id: teacher_id || null,
        file_name,
        generation_params: generation_params || {},
        generated_by: user.id,
      })
      .select(
        `
        *,
        teacher:teacher_id (
          id,
          full_name,
          employee_id,
          email
        ),
        generated_by_user:generated_by (
          id,
          full_name,
          employee_id,
          email
        )
      `
      )
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create report', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
