/* eslint-disable consistent-return */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'admin';
  employee_id: string;
  management_unit: string;
  phone_number?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<AuthUser>
  ) => Promise<{ error: AuthError | null | Error }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Partial<AuthUser>
  ) => Promise<{ error: AuthError | null | Error }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const profileCache = useRef<{ [key: string]: AuthUser }>({});
  const isFetchingProfile = useRef(false);

  // Profile fetch with timeout and error handling
  const fetchUserProfile = useCallback(
    async (userId: string, email: string) => {
      // Shorter timeout in development mode
      const isDev = process.env.NODE_ENV === 'development';
      const PROFILE_TIMEOUT = isDev ? 3000 : 5000; // 3s in dev, 5s in prod

      if (isFetchingProfile.current) {
        return;
      }

      // Check cache first
      if (profileCache.current[userId]) {
        setUser(profileCache.current[userId]);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT);

      isFetchingProfile.current = true;

      try {
        const response = await fetch(
          `/api/auth/profile?email=${encodeURIComponent(email)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: session?.access_token
                ? `Bearer ${session.access_token}`
                : '',
            },
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const result = await response.json();
          const validatedUser = {
            ...result.user,
            id: userId, // Ensure ID matches
            email, // Ensure email matches
          };
          setUser(validatedUser);
          profileCache.current[userId] = validatedUser;
        } else if (response.status === 404) {
          // Create basic profile for new users
          const basicUser: AuthUser = {
            id: userId,
            email,
            full_name: email.split('@')[0],
            role: 'teacher',
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
          };
          setUser(basicUser);
          profileCache.current[userId] = basicUser;
        } else {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Use fallback profile on error
        const basicUser: AuthUser = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'teacher',
          employee_id: 'PENDING',
          management_unit: 'Demo Unit',
        };
        setUser(basicUser);
        profileCache.current[userId] = basicUser;
      } finally {
        clearTimeout(timeoutId);
        isFetchingProfile.current = false;
        setLoading(false);
      }
    },
    [session?.access_token]
  );

  // Initialize auth state with timeout
  useEffect(() => {
    let mounted = true;
    // Shorter timeout in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const AUTH_INIT_TIMEOUT = isDev ? 3000 : 5000; // 3s in dev, 5s in prod

    const initializeAuth = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        if (mounted) {
          // Force loading to false after timeout
          setLoading(false);
          setIsInitialized(true);
        }
      }, AUTH_INIT_TIMEOUT);

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        setSession(initialSession);

        if (initialSession?.user) {
          try {
            await Promise.race([
              fetchUserProfile(
                initialSession.user.id,
                initialSession.user.email!
              ),
              new Promise((_, reject) => {
                setTimeout(() => {
                  reject(
                    new Error('Profile fetch timeout during initialization')
                  );
                }, 3000); // Reduced to 3 seconds for initial profile fetch
              }),
            ]);
          } catch {
            // Continue without error notification - just set loading to false
            if (mounted) {
              setLoading(false);
            }
          }
        }

        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUserProfile]);

  // Listen for auth state changes
  useEffect(() => {
    if (!isInitialized) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        profileCache.current = {};
        setLoading(false);
      }

      // Update session
      setSession(newSession);

      // Handle user authentication
      if (
        newSession?.user &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        await fetchUserProfile(newSession.user.id, newSession.user.email!);
      } else if (newSession?.user && !user) {
        await fetchUserProfile(newSession.user.id, newSession.user.email!);
      } else if (!newSession?.user) {
        setUser(null);
        profileCache.current = {};
        setLoading(false);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, fetchUserProfile, user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    const SIGN_IN_TIMEOUT = 15000; // 15 seconds total timeout
    const controller = new AbortController();
    setTimeout(() => controller.abort(), SIGN_IN_TIMEOUT);

    try {
      // Clear any existing state
      setUser(null);
      setSession(null);
      profileCache.current = {};

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        throw new Error('Failed to establish session');
      }

      setSession(currentSession);

      try {
        const response = await fetch(
          `/api/auth/profile?email=${encodeURIComponent(email)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentSession.access_token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const { user: profile } = await response.json();
          if (profile) {
            setUser(profile);
            profileCache.current[currentSession.user.id] = profile;
          }
        }
      } catch {
        // Don't fail sign in on profile fetch error
      }

      return { error: null };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      setLoading(false);
      return {
        error: new AuthError(
          isTimeout ? 'Sign in timeout' : 'Sign in failed',
          500
        ),
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Set loading state to prevent any UI updates during logout
      setLoading(true);

      // Clear auth state immediately to prevent any auth-dependent operations
      setUser(null);
      setSession(null);
      profileCache.current = {};

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Allow time for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reset loading state - let the auth state change handle navigation
      setLoading(false);
    } catch {
      // Even if Supabase signOut fails, ensure local state is cleared
      setUser(null);
      setSession(null);
      profileCache.current = {};
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<AuthUser>
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Signup failed'),
      };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        profileCache.current[user.id] = updatedUser;
      }

      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Update failed'),
      };
    }
  };

  const refreshProfile = async () => {
    if (!session?.user?.id || !session?.user?.email) return;

    // Clear cache and refetch
    delete profileCache.current[session.user.id];
    setLoading(true);
    await fetchUserProfile(session.user.id, session.user.email);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Add display name for Fast Refresh stability
AuthProvider.displayName = 'AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
