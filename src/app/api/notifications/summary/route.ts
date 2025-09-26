import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// GET - Get notification summary for the current user
export async function GET(request: NextRequest) {
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

    // Call the stored function to get notification summary
    const { data: summary, error: summaryError } = await supabaseAdmin.rpc(
      'get_notification_summary',
      {
        p_user_id: user.id,
      }
    );

    if (summaryError) {
      // eslint-disable-next-line no-console
      console.error('Error getting notification summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to get notification summary' },
        { status: 500 }
      );
    }

    // The function returns an array with one row
    const summaryData = summary?.[0] || {
      total_count: 0,
      unread_count: 0,
      high_priority_unread: 0,
      recent_count: 0,
    };

    // Get breakdown by type for additional insights
    const { data: typeBreakdown, error: typeError } = await supabaseAdmin
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', user.id)
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ); // Last 30 days

    if (typeError) {
      // eslint-disable-next-line no-console
      console.error('Error getting type breakdown:', typeError);
    }

    type Breakdown = Record<string, { total: number; unread: number }>;
    type NotificationType = { type: string; is_read: boolean };

    const breakdown =
      typeBreakdown?.reduce(
        (acc: Breakdown, notification: NotificationType) => {
          if (!acc[notification.type]) {
            acc[notification.type] = { total: 0, unread: 0 };
          }
          acc[notification.type].total++;
          if (!notification.is_read) {
            acc[notification.type].unread++;
          }
          return acc;
        },
        {} as Breakdown
      ) || {};

    return NextResponse.json({
      summary: {
        total_count: parseInt(summaryData.total_count?.toString() || '0'),
        unread_count: parseInt(summaryData.unread_count?.toString() || '0'),
        high_priority_unread: parseInt(
          summaryData.high_priority_unread?.toString() || '0'
        ),
        recent_count: parseInt(summaryData.recent_count?.toString() || '0'),
      },
      breakdown,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Notification summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
