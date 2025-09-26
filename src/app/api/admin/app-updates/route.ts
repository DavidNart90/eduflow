import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createNotificationForAllUsers } from '@/lib/notifications';

// POST /api/admin/app-updates - Send app update notification to all users
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { version, features, target_role } = body;

    // Validate required fields
    if (!version) {
      return NextResponse.json(
        { error: 'Version is required' },
        { status: 400 }
      );
    }

    // Send notifications to all users or specific role
    const result = await createNotificationForAllUsers(
      {
        type: 'app_update',
        title: `App Update Available - v${version}`,
        message: features
          ? `A new version (v${version}) is available with new features: ${features}`
          : `A new version (v${version}) is available. Please update your app for the latest improvements.`,
        metadata: {
          version,
          features: features || '',
          update_type: 'feature_release',
        },
        priority: 'normal',
        created_by: user.id,
      },
      target_role === 'all' ? undefined : target_role
    );

    // eslint-disable-next-line no-console
    console.log(
      `Created app update notifications: ${result.successful} successful, ${result.failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: `App update notification sent successfully`,
      result: {
        version,
        features,
        target_role: target_role || 'all',
        notifications_sent: result.successful,
        failed_notifications: result.failed,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending app update notification:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/app-updates - Get app update history (future implementation)
export function GET() {
  return NextResponse.json({
    success: true,
    message: 'App update history endpoint - not implemented yet',
    updates: [],
  });
}
