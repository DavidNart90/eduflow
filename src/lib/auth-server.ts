import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase, createServerSupabaseClient } from './supabase';

interface AuthResult {
  user: {
    id: string;
    email: string;
    role: 'teacher' | 'admin';
  } | null;
  error: string | null;
}

export async function validateAdminAuth(
  request: NextRequest
): Promise<AuthResult> {
  try {
    let userEmail = null;

    // First, try to get authorization from header (token-based auth)
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Verify the token with the regular Supabase client
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (!error && user) {
          userEmail = user.email;
        }
      } catch {
        // Token verification failed, will try cookie fallback
      }
    }

    // Fallback: try to get session from cookies using SSR client
    if (!userEmail) {
      try {
        const cookieStore = await cookies();

        const supabaseSSR = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              },
            },
          }
        );

        const {
          data: { user: authUser },
          error: authError,
        } = await supabaseSSR.auth.getUser();

        if (!authError && authUser) {
          userEmail = authUser.email;
        }
      } catch {
        // SSR auth failed
      }
    }

    // Final fallback: try regular session
    if (!userEmail) {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!sessionError && session) {
          userEmail = session.user.email;
        }
      } catch {
        // Session retrieval failed
      }
    }

    if (!userEmail) {
      return { user: null, error: 'Unauthorized - No valid session' };
    }

    // Get current user profile to check if admin using service role client
    const supabaseAdmin = createServerSupabaseClient();

    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail)
      .single();

    if (userError || !currentUser) {
      return { user: null, error: 'User profile not found' };
    }

    if (currentUser.role !== 'admin') {
      return { user: null, error: 'Access denied. Admin role required.' };
    }

    return {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
      error: null,
    };
  } catch {
    return { user: null, error: 'Authentication validation failed' };
  }
}

export async function validateUserAuth(
  request: NextRequest
): Promise<AuthResult> {
  try {
    let userEmail = null;

    // First, try to get authorization from header (token-based auth)
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Verify the token with the regular Supabase client
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (!error && user) {
          userEmail = user.email;
        }
      } catch {
        // Token verification failed, will try cookie fallback
      }
    }

    // Fallback: try to get session from cookies using SSR client
    if (!userEmail) {
      try {
        const cookieStore = await cookies();

        const supabaseSSR = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              },
            },
          }
        );

        const {
          data: { user: authUser },
          error: authError,
        } = await supabaseSSR.auth.getUser();

        if (!authError && authUser) {
          userEmail = authUser.email;
        }
      } catch {
        // SSR auth failed
      }
    }

    // Final fallback: try regular session
    if (!userEmail) {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!sessionError && session) {
          userEmail = session.user.email;
        }
      } catch {
        // Session retrieval failed
      }
    }

    if (!userEmail) {
      return { user: null, error: 'Unauthorized - No valid session' };
    }

    // Get current user profile using service role client
    const supabaseAdmin = createServerSupabaseClient();

    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail)
      .single();

    if (userError || !currentUser) {
      return { user: null, error: 'User profile not found' };
    }

    return {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
      error: null,
    };
  } catch {
    return { user: null, error: 'Authentication validation failed' };
  }
}
