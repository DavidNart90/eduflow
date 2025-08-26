import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST /api/admin/reports/bulk - Generate reports for multiple teachers
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
    const {
      teacher_ids,
      report_type = 'teacher_statement',
      start_date,
      end_date,
    } = body;

    // Validate required fields
    if (
      !teacher_ids ||
      !Array.isArray(teacher_ids) ||
      teacher_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'teacher_ids array is required' },
        { status: 400 }
      );
    }

    // Create a bulk report generation job
    const { data: job, error: jobError } = await supabase
      .from('report_generation_jobs')
      .insert({
        job_type: 'bulk',
        status: 'pending',
        total_reports: teacher_ids.length,
        completed_reports: 0,
        failed_reports: 0,
        job_params: {
          teacher_ids,
          report_type,
          start_date,
          end_date,
          requested_at: new Date().toISOString(),
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create bulk job', details: jobError.message },
        { status: 500 }
      );
    }

    // Start processing the job (in a real system, this would be async)
    // For demonstration, we'll update the job status
    await supabase.rpc('update_report_job_progress', {
      p_job_id: job.id,
      p_status: 'processing',
      p_progress_percentage: 0,
    });

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: 'processing',
      total_reports: teacher_ids.length,
      message: 'Bulk report generation job started',
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

// GET /api/admin/reports/bulk?job_id=xxx - Check job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const job_id = searchParams.get('job_id');

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id parameter is required' },
        { status: 400 }
      );
    }

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

    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('report_generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
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
