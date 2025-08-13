import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Supabase environment variables',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get session',
          details: sessionError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session check',
      data: {
        hasSession: Boolean(session),
        hasUser: Boolean(session?.user),
        hasEmail: Boolean(session?.user?.email),
        hasId: Boolean(session?.user?.id),
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null,
        sessionData: session
          ? {
              access_token: session.access_token ? 'present' : 'missing',
              refresh_token: session.refresh_token ? 'present' : 'missing',
              expires_at: session.expires_at,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
