import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateUserAuth } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    // Validate user authentication
    const { user, error: authError } = await validateUserAuth(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client to get fresh user data
    const supabaseAdmin = createServerSupabaseClient();

    // Get fresh user profile from database
    const { data: freshUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (userError || !freshUser) {
      return NextResponse.json(
        { error: 'Failed to fetch updated user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: freshUser,
      message: 'Session refreshed successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
