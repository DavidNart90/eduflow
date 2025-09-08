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
import { sessionManager } from './auth-session-manager';

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
  ) => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Partial<AuthUser>
  ) => Promise<{ error: AuthError | Error | null }>;
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
  const initializationRef = useRef(false);
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force loading completion after maximum time
  useEffect(() => {
    if (loading && !loadingTimeoutRef.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.warn('Auth loading timeout reached, forcing completion');
        if (mountedRef.current) {
          setLoading(false);
          setIsInitialized(true);
        }
      }, 8000); // 8 seconds max
    } else if (!loading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [loading]);

  // Profile fetch with aggressive timeout and guaranteed completion
  const fetchUserProfile = useCallback(
    async (userId: string, email: string): Promise<AuthUser | null> => {
      // Prevent multiple simultaneous fetches for the same user
      if (isFetchingProfile.current || !mountedRef.current) {
        return null;
      }

      // Create a more robust cache key
      const cacheKey = `${userId}_${email}`;

      // Check cache first with both userId and composite key
      if (profileCache.current[userId] || profileCache.current[cacheKey]) {
        const cachedUser =
          profileCache.current[userId] || profileCache.current[cacheKey];
        setUser(cachedUser);
        return cachedUser;
      }

      const PROFILE_TIMEOUT = 3000; // Aggressive 3-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.warn(
          'Profile fetch timeout - aborting and creating fallback user'
        );
        controller.abort();
      }, PROFILE_TIMEOUT);

      isFetchingProfile.current = true;

      try {
        const fetchPromise = fetch(
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

        // Race the fetch against timeout
        const response = (await Promise.race([
          fetchPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Profile fetch timeout')),
              PROFILE_TIMEOUT - 100
            )
          ),
        ])) as Response;

        if (!mountedRef.current) {
          return null;
        }

        if (response.ok) {
          const result = await response.json();
          const validatedUser: AuthUser = {
            ...result.user,
            id: userId,
            email,
          };
          setUser(validatedUser);
          // Cache with both keys for better hit rate
          profileCache.current[userId] = validatedUser;
          profileCache.current[cacheKey] = validatedUser;
          // Store session info for quick restoration
          sessionManager.storeSessionInfo({
            userId,
            email,
            role: validatedUser.role,
          });
          return validatedUser;
        }

        // Handle 404 or other errors by creating fallback user
        // eslint-disable-next-line no-console
        console.log(
          'Profile API returned non-OK status, creating fallback user'
        );
        throw new Error(`Profile fetch failed: ${response.status}`);
      } catch (error) {
        if (!mountedRef.current) return null;

        // eslint-disable-next-line no-console
        console.warn('Profile fetch failed, creating fallback user:', error);

        // Always create fallback user when profile fetch fails
        const basicUser: AuthUser = {
          id: userId,
          email,
          full_name: email.split('@')[0] || 'User',
          role: 'teacher',
          employee_id: 'PENDING',
          management_unit: 'Demo Unit',
        };

        setUser(basicUser);
        profileCache.current[userId] = basicUser;
        profileCache.current[cacheKey] = basicUser;
        return basicUser;
      } finally {
        clearTimeout(timeoutId);
        isFetchingProfile.current = false;
      }
    },
    [session?.access_token]
  ); // Initialize auth state with session manager and loading loop detection
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    // Start loading check timer
    sessionManager.startLoadingCheck();

    let mounted = true;
    const AUTH_INIT_TIMEOUT = 5000; // 5 seconds max

    const initializeAuth = async () => {
      // Check if we've been loading too long
      if (sessionManager.hasExceededMaxTime()) {
        // eslint-disable-next-line no-console
        console.warn(
          'Max loading time exceeded, clearing caches and forcing reset'
        );
        sessionManager.clearAllAuthData();
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted || !mountedRef.current) return;

        if (error) {
          // eslint-disable-next-line no-console
          console.warn('Auth initialization error:', error);
          sessionManager.resetLoadingCheck();
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        setSession(initialSession);

        if (initialSession?.user?.id && initialSession?.user?.email) {
          // Check if we have stored session info for quick restoration
          const storedInfo = sessionManager.getStoredSessionInfo();
          if (storedInfo && storedInfo.userId === initialSession.user.id) {
            const quickUser: AuthUser = {
              id: storedInfo.userId,
              email: storedInfo.email,
              full_name: storedInfo.email.split('@')[0] || 'User',
              role: 'teacher',
              employee_id: 'PENDING',
              management_unit: 'Demo Unit',
            };
            setUser(quickUser);
            profileCache.current[storedInfo.userId] = quickUser;

            // Try to fetch fresh profile in background
            fetchUserProfile(
              initialSession.user.id,
              initialSession.user.email
            ).catch(error =>
              // eslint-disable-next-line no-console
              console.warn('Background profile fetch failed:', error)
            );
          } else {
            // No stored info, fetch profile with timeout
            try {
              await Promise.race([
                fetchUserProfile(
                  initialSession.user.id,
                  initialSession.user.email
                ),
                new Promise(resolve =>
                  setTimeout(() => {
                    // eslint-disable-next-line no-console
                    console.warn(
                      'Profile fetch timeout during initialization - using fallback'
                    );
                    const fallbackUser: AuthUser = {
                      id: initialSession.user.id,
                      email: initialSession.user.email!,
                      full_name:
                        initialSession.user.email!.split('@')[0] || 'User',
                      role: 'teacher',
                      employee_id: 'PENDING',
                      management_unit: 'Demo Unit',
                    };
                    setUser(fallbackUser);
                    profileCache.current[initialSession.user.id] = fallbackUser;
                    resolve(null);
                  }, 2000)
                ),
              ]);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn(
                'Profile fetch failed during initialization:',
                error
              );
            }
          }

          // Always complete initialization
          if (mounted && mountedRef.current) {
            sessionManager.resetLoadingCheck();
            setLoading(false);
            setIsInitialized(true);
          }
        } else {
          // No session, complete initialization immediately
          if (mounted && mountedRef.current) {
            sessionManager.resetLoadingCheck();
            setLoading(false);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Auth initialization failed:', error);
        if (mounted && mountedRef.current) {
          sessionManager.resetLoadingCheck();
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Add aggressive timeout as fallback
    const timeoutId = setTimeout(() => {
      if (mounted && mountedRef.current && !isInitialized) {
        // eslint-disable-next-line no-console
        console.error('AUTH TIMEOUT: Forcing auth initialization completion');
        sessionManager.resetLoadingCheck();
        setLoading(false);
        setIsInitialized(true);
      }
    }, AUTH_INIT_TIMEOUT);

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchUserProfile, isInitialized]);

  // Listen for auth state changes with guaranteed completion
  useEffect(() => {
    if (!isInitialized) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        profileCache.current = {};
        setLoading(false);
        return;
      }

      // Update session
      setSession(newSession);

      // Handle user authentication with guaranteed completion
      if (newSession?.user?.id && newSession?.user?.email) {
        const cacheKey = `${newSession.user.id}_${newSession.user.email}`;

        // Check if we already have this user in cache
        if (
          profileCache.current[newSession.user.id] ||
          profileCache.current[cacheKey]
        ) {
          const cachedUser =
            profileCache.current[newSession.user.id] ||
            profileCache.current[cacheKey];
          setUser(cachedUser);
          setLoading(false);
          return;
        }

        // For all events, try to fetch profile with aggressive timeout

        try {
          // Use Promise.race to guarantee completion
          await Promise.race([
            fetchUserProfile(newSession.user.id, newSession.user.email),
            new Promise(
              resolve =>
                setTimeout(() => {
                  // eslint-disable-next-line no-console
                  console.warn(
                    'Profile fetch timeout in auth state change - creating fallback'
                  );
                  // Create fallback user immediately
                  const fallbackUser: AuthUser = {
                    id: newSession.user.id,
                    email: newSession.user.email!,
                    full_name: newSession.user.email!.split('@')[0] || 'User',
                    role: 'teacher',
                    employee_id: 'PENDING',
                    management_unit: 'Demo Unit',
                  };
                  setUser(fallbackUser);
                  profileCache.current[newSession.user.id] = fallbackUser;
                  profileCache.current[cacheKey] = fallbackUser;
                  resolve(null);
                }, 2000) // Even more aggressive 2-second timeout
            ),
          ]);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Profile fetch error in auth state change:', error);
          // Create fallback user on any error
          const fallbackUser: AuthUser = {
            id: newSession.user.id,
            email: newSession.user.email!,
            full_name: newSession.user.email!.split('@')[0] || 'User',
            role: 'teacher',
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
          };
          setUser(fallbackUser);
          profileCache.current[newSession.user.id] = fallbackUser;
          profileCache.current[cacheKey] = fallbackUser;
        }

        // ALWAYS set loading to false after auth state change processing
        if (mountedRef.current) {
          setLoading(false);
        }
      } else if (!newSession?.user) {
        // No user session
        setUser(null);
        profileCache.current = {};
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    if (!mountedRef.current)
      return { error: new AuthError('Component unmounted', 500) };

    setLoading(true);

    try {
      // Clear any existing state
      setUser(null);
      setSession(null);
      profileCache.current = {};

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('Supabase auth error:', error);
        setLoading(false);
        return { error };
      }

      if (!data.session || !data.user) {
        // eslint-disable-next-line no-console
        console.warn('No session or user returned from Supabase');
        setLoading(false);
        return { error: new AuthError('Failed to establish session', 500) };
      }

      // Set session immediately
      setSession(data.session);

      // Fetch user profile with timeout - don't let it hang indefinitely
      try {
        const profilePromise = fetchUserProfile(data.user.id, data.user.email!);
        await Promise.race([
          profilePromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Profile fetch timeout during sign in')),
              7000
            )
          ),
        ]);

        if (mountedRef.current) {
          // Profile loaded successfully, loading state is already set to false in fetchUserProfile
          return { error: null };
        }
      } catch (profileError) {
        // eslint-disable-next-line no-console
        console.warn('Profile fetch failed during sign in:', profileError);
        // Even if profile fetch fails, sign in was successful
        // Create a basic fallback user to prevent getting stuck
        const fallbackUser = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.email!.split('@')[0],
          role: 'teacher' as const,
          employee_id: 'PENDING',
          management_unit: 'Demo Unit',
        };
        setUser(fallbackUser);
        profileCache.current[data.user.id] = fallbackUser;
        profileCache.current[`${data.user.id}_${data.user.email}`] =
          fallbackUser;

        if (mountedRef.current) {
          setLoading(false);
        }
        return { error: null };
      }

      // Fallback - if we somehow get here, ensure loading is false
      if (mountedRef.current) {
        setLoading(false);
      }
      return { error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Sign in error:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
      return {
        error:
          error instanceof AuthError
            ? error
            : new AuthError('Sign in failed', 500),
      };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      // Set loading state to prevent any UI updates during logout
      setLoading(true);

      // Clear auth state immediately to prevent any auth-dependent operations
      setUser(null);
      setSession(null);
      profileCache.current = {};

      // Clear session manager data
      sessionManager.clearSessionInfo();
      sessionManager.resetLoadingCheck();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Reset loading state - let the auth state change handle navigation
      if (mountedRef.current) {
        setLoading(false);
      }
    } catch {
      // Even if Supabase signOut fails, ensure local state is cleared
      if (mountedRef.current) {
        setUser(null);
        setSession(null);
        profileCache.current = {};
        sessionManager.clearSessionInfo();
        sessionManager.resetLoadingCheck();
        setLoading(false);
      }
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
    if (!session?.user?.id || !session?.user?.email || !mountedRef.current)
      return;

    // Clear cache with both keys and refetch
    const cacheKey = `${session.user.id}_${session.user.email}`;
    delete profileCache.current[session.user.id];
    delete profileCache.current[cacheKey];
    setLoading(true);
    await fetchUserProfile(session.user.id, session.user.email);

    if (mountedRef.current) {
      setLoading(false);
    }
  };

  // Cleanup effect
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

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
