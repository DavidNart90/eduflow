import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Verify the token with the regular Supabase client
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

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create a server-side Supabase client
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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Get all interest settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('interest_settings')
      .select(
        `
        *,
        created_by_user:users!interest_settings_created_by_fkey(full_name, email)
      `
      )
      .order('created_at', { ascending: false });

    if (settingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch interest settings' },
        { status: 500 }
      );
    }

    // Get active setting
    const activeSetting = settings?.find(setting => setting.is_active);

    return NextResponse.json({
      success: true,
      active_setting: activeSetting || null,
      all_settings: settings || [],
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { interest_rate, payment_frequency } = body;

    // Validate input
    if (!interest_rate || interest_rate < 0 || interest_rate > 1) {
      return NextResponse.json(
        { error: 'Interest rate must be between 0 and 1 (0% to 100%)' },
        { status: 400 }
      );
    }

    if (
      !payment_frequency ||
      !['quarterly', 'semi-annual', 'annual'].includes(payment_frequency)
    ) {
      return NextResponse.json(
        {
          error: 'Payment frequency must be quarterly, semi-annual, or annual',
        },
        { status: 400 }
      );
    }

    try {
      // Start a transaction to update settings
      const { error: deactivateError } = await supabaseAdmin
        .from('interest_settings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true);

      if (deactivateError) {
        return NextResponse.json(
          { error: 'Failed to update interest settings' },
          { status: 500 }
        );
      }

      // Create new active setting
      const { data: newSetting, error: createError } = await supabaseAdmin
        .from('interest_settings')
        .insert({
          interest_rate: parseFloat(interest_rate),
          payment_frequency,
          is_active: true,
          created_by: user.id,
        })
        .select(
          `
          *,
          created_by_user:users!interest_settings_created_by_fkey(full_name, email)
        `
        )
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create new interest setting' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Interest settings updated successfully',
        setting: newSetting,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
