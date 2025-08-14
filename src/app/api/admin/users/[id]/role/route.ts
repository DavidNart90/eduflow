import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateAdminAuth } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const { user, error: authError } = await validateAdminAuth(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    const { role } = await request.json();

    // Validate role
    if (!role || !['teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "teacher" or "admin"' },
        { status: 400 }
      );
    }

    // Use service role client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Check if user exists
    const { data: userToUpdate, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent changing your own role
    if (userToUpdate.email === user.email) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update the user role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User role updated successfully',
      role,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
