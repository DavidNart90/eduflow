import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// GET - Fetch user's notifications
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type');
    const is_read = searchParams.get('is_read');
    const priority = searchParams.get('priority');

    // Build query
    let query = supabaseAdmin
      .from('notification_details')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (is_read !== null) {
      query = query.eq('is_read', is_read === 'true');
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (type) countQuery = countQuery.eq('type', type);
    if (is_read !== null)
      countQuery = countQuery.eq('is_read', is_read === 'true');
    if (priority) countQuery = countQuery.eq('priority', priority);

    const { count, error: countError } = await countQuery;

    if (countError) {
      // eslint-disable-next-line no-console
      console.error('Error counting notifications:', countError);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification (admin only)
export async function POST(request: NextRequest) {
  try {
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
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      type,
      title,
      message,
      metadata = {},
      priority = 'normal',
      expires_at,
    } = body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title, message' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = [
      'momo_transaction',
      'admin_report',
      'controller_report',
      'app_update',
      'system',
      'interest_payment',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Create notification
    const { data: notification, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        metadata,
        priority,
        expires_at,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error('Error creating notification:', insertError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
