import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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
    const token = authHeader.substring(7);

    // Test auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Invalid authentication',
          details: authError?.message,
        },
        { status: 401 }
      );
    }

    // Test user lookup
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', user.email)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: 'User profile lookup failed',
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    // Test database access
    const { data: tables, error: tablesError } = await supabase
      .from('report_templates')
      .select('id, name, type')
      .limit(1);

    if (tablesError) {
      return NextResponse.json(
        {
          error: 'Database access failed',
          details: tablesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profile: userProfile,
      },
      database_test: {
        can_access_templates: !tablesError,
        template_count: tables?.length || 0,
      },
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
