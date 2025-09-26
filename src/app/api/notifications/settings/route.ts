import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';

interface NotificationSettings {
  id: string;
  user_id: string;
  momo_transaction_enabled: boolean;
  admin_report_enabled: boolean;
  controller_report_enabled: boolean;
  app_update_enabled: boolean;
  system_enabled: boolean;
  interest_payment_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Get user's notification settings
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

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      // If no settings found, create default settings
      if (settingsError.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabaseAdmin
          .from('notification_settings')
          .insert({
            user_id: user.id,
            momo_transaction_enabled: true,
            admin_report_enabled: true,
            controller_report_enabled: true,
            app_update_enabled: true,
            system_enabled: true,
            interest_payment_enabled: true,
          })
          .select()
          .single();

        if (createError) {
          // eslint-disable-next-line no-console
          console.error('Error creating default settings:', createError);
          return NextResponse.json(
            { error: 'Failed to create notification settings' },
            { status: 500 }
          );
        }

        return NextResponse.json({ settings: newSettings });
      }

      // eslint-disable-next-line no-console
      console.error('Error fetching notification settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Notification settings GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification settings
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      momo_transaction_enabled,
      admin_report_enabled,
      controller_report_enabled,
      app_update_enabled,
      system_enabled,
      interest_payment_enabled,
    } = body;

    // Build update object with only provided fields
    const updateData: Partial<NotificationSettings> = {};

    if (typeof momo_transaction_enabled === 'boolean') {
      updateData.momo_transaction_enabled = momo_transaction_enabled;
    }
    if (typeof admin_report_enabled === 'boolean') {
      updateData.admin_report_enabled = admin_report_enabled;
    }
    if (typeof controller_report_enabled === 'boolean') {
      updateData.controller_report_enabled = controller_report_enabled;
    }
    if (typeof app_update_enabled === 'boolean') {
      updateData.app_update_enabled = app_update_enabled;
    }
    if (typeof system_enabled === 'boolean') {
      updateData.system_enabled = system_enabled;
    }
    if (typeof interest_payment_enabled === 'boolean') {
      updateData.interest_payment_enabled = interest_payment_enabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided to update' },
        { status: 400 }
      );
    }

    // Update notification settings
    const { data: updatedSettings, error: updateError } = await supabaseAdmin
      .from('notification_settings')
      .upsert(
        {
          user_id: user.id,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error('Error updating notification settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: updatedSettings,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Notification settings PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
