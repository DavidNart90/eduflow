import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_type, total_reports, job_params } = body;

    // Validate required fields
    if (!job_type || !total_reports) {
      return NextResponse.json(
        { error: 'Job type and total_reports are required' },
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
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create the job
    const { data: job, error: createError } = await supabase
      .from('report_generation_jobs')
      .insert({
        job_type,
        total_reports,
        job_params,
        created_by: userProfile.id,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: job.id,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

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
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('report_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: jobs?.length || 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
