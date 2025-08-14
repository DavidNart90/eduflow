import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateAdminAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const { user, error: authError } = await validateAdminAuth(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client to fetch users
    const supabaseAdmin = createServerSupabaseClient();

    // Fetch all users from the public users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        employee_id,
        management_unit,
        role,
        created_at
      `
      )
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      total: users?.length || 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error while fetching users' },
      { status: 500 }
    );
  }
}
