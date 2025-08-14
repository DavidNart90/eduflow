import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateAdminAuth } from '@/lib/auth-server';

export async function DELETE(
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

    // Use service role client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Check if user exists and get their details
    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting the current admin user
    if (userToDelete.email === user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the user from the users table
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Note: In a production environment, you might also want to:
    // 1. Delete the user from Supabase Auth
    // 2. Clean up related data (savings_transactions, teacher_balances, etc.)
    // For now, we're just removing from the users table

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
