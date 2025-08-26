import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'teacher', 'association', 'controller'

    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify admin access (templates are admin-only)
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
      .from('report_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0,
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
    const body = await request.json();
    const { name, type, template_data } = body;

    // Validate required fields
    if (!name || !type || !template_data) {
      return NextResponse.json(
        {
          error: 'Name, type, and template_data are required',
          received: {
            name: Boolean(name),
            type: Boolean(type),
            template_data: Boolean(template_data),
          },
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!['teacher', 'association', 'controller'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid template type',
          received: type,
          allowed: ['teacher', 'association', 'controller'],
        },
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
        {
          error: 'Invalid authentication',
          details: authError?.message,
        },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: 'User profile lookup failed',
          details: profileError.message,
          user_email: user.email,
        },
        { status: 500 }
      );
    }

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          user_role: userProfile?.role || 'none',
        },
        { status: 403 }
      );
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('report_templates')
      .insert({
        name,
        type,
        template_data,
        created_by: userProfile.id,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        {
          error: 'Failed to create template',
          details: createError.message,
          code: createError.code,
          hint: createError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
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
