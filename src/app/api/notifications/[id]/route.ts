import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// PATCH - Mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

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

    // Call the stored function to mark notification as read
    const { data, error: markReadError } = await supabaseAdmin.rpc(
      'mark_notification_read',
      {
        p_notification_id: id,
        p_user_id: user.id,
      }
    );

    if (markReadError) {
      // eslint-disable-next-line no-console
      console.error('Error marking notification as read:', markReadError);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found or already read' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification marked as read',
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Mark notification read API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification (admin only or own notification)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get the notification to check ownership
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user owns the notification or is admin
    if (notification.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the notification
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notification deleted successfully',
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
