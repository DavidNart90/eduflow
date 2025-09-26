import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// PATCH - Mark all notifications as read for the current user
export async function PATCH(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
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
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServerSupabaseClient();

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Call the stored function to mark all notifications as read
    const { data: markedCount, error: markAllReadError } =
      await supabaseAdmin.rpc('mark_all_notifications_read', {
        p_user_id: user.id,
      });

    if (markAllReadError) {
      // eslint-disable-next-line no-console
      console.error(
        'Error marking all notifications as read:',
        markAllReadError
      );
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${markedCount || 0} notifications marked as read`,
      markedCount: markedCount || 0,
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Mark all notifications read API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
