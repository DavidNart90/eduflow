import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

// POST - Create notification from template
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
      template_name,
      variables = {},
      priority = 'normal',
      expires_at,
    } = body;

    // Validate required fields
    if (!user_id || !type || !template_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, template_name' },
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

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Call the stored function to create notification from template
    const { data: notificationId, error: createError } =
      await supabaseAdmin.rpc('create_notification_from_template', {
        p_user_id: user_id,
        p_type: type,
        p_template_name: template_name,
        p_variables: variables,
        p_priority: priority,
        p_created_by: currentUser.id,
        p_expires_at: expires_at,
      });

    if (createError) {
      // eslint-disable-next-line no-console
      console.error('Error creating notification from template:', createError);

      // Check if it's a template not found error
      if (createError.message?.includes('Template not found')) {
        return NextResponse.json(
          { error: `Template not found: ${type}/${template_name}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create notification from template' },
        { status: 500 }
      );
    }

    // Get the created notification details
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notification_details')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error('Error fetching created notification:', fetchError);
      // Still return success since notification was created
      return NextResponse.json(
        {
          message: 'Notification created successfully',
          notification_id: notificationId,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: 'Notification created successfully',
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create notification from template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get available notification templates
export async function GET(request: NextRequest) {
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

    // Get available templates
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('name');

    if (templatesError) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notification templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch notification templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: templates || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get notification templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
