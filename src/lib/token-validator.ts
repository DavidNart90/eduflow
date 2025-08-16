import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  session: Session | null;
  error?: string;
}

/**
 * Validates the current session and checks if tokens need refresh
 */
export async function validateAndRefreshTokens(): Promise<TokenValidationResult> {
  try {
    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        isValid: false,
        needsRefresh: false,
        session: null,
        error: sessionError.message,
      };
    }

    if (!session) {
      return {
        isValid: false,
        needsRefresh: false,
        session: null,
        error: 'No active session',
      };
    }

    // Check if access token is expired or will expire soon (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;
    const shouldRefresh = timeUntilExpiry < 300; // Refresh if expires within 5 minutes

    if (shouldRefresh) {
      // Attempt to refresh the session
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        return {
          isValid: false,
          needsRefresh: true,
          session: null,
          error: `Token refresh failed: ${refreshError.message}`,
        };
      }

      return {
        isValid: true,
        needsRefresh: true,
        session: refreshedSession,
      };
    }

    // Validate that the user exists and token is actually valid
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        isValid: false,
        needsRefresh: false,
        session: null,
        error: userError?.message || 'Invalid user token',
      };
    }

    return {
      isValid: true,
      needsRefresh: false,
      session,
    };
  } catch (error) {
    return {
      isValid: false,
      needsRefresh: false,
      session: null,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}

/**
 * Checks if a session is expired or will expire soon
 */
export function isSessionExpiringSoon(
  session: Session | null,
  bufferMinutes = 5
): boolean {
  if (!session || !session.expires_at) return true;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const timeUntilExpiry = expiresAt - now;

  return timeUntilExpiry < bufferMinutes * 60;
}

/**
 * Force refresh session tokens
 */
export async function forceRefreshSession(): Promise<{
  session: Session | null;
  error: string | null;
}> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session, error: null };
  } catch (error) {
    return {
      session: null,
      error:
        error instanceof Error ? error.message : 'Failed to refresh session',
    };
  }
}
