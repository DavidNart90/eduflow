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

  // Profile fetch with timeout and error handling
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

      const PROFILE_TIMEOUT = 8000; // Increased timeout
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

        if (!mountedRef.current) return null;

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
          return validatedUser;
        }

        if (response.status === 404) {
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
          profileCache.current[cacheKey] = basicUser;
          return basicUser;
        }

        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      } catch (error) {
        if (!mountedRef.current) return null;

        // Only create fallback if it's not an abort error
        if (!(error instanceof Error && error.name === 'AbortError')) {
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
          profileCache.current[cacheKey] = basicUser;
          return basicUser;
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
        isFetchingProfile.current = false;
      }
    },
    [session?.access_token]
  ); // Initialize auth state with timeout
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    let mounted = true;
    const AUTH_INIT_TIMEOUT = 10000; // Increased timeout

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted || !mountedRef.current) return;

        if (error) {
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        setSession(initialSession);

        if (initialSession?.user?.id && initialSession?.user?.email) {
          // Fetch user profile and wait for completion
          await fetchUserProfile(
            initialSession.user.id,
            initialSession.user.email
          );

          // Only set loading to false after we have user data or confirmed failure
          if (mounted && mountedRef.current) {
            setLoading(false);
            setIsInitialized(true);
          }
        } else {
          // No session, safe to set loading to false
          if (mounted && mountedRef.current) {
            setLoading(false);
            setIsInitialized(true);
          }
        }
      } catch {
        if (mounted && mountedRef.current) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Add timeout as fallback
    const timeoutId = setTimeout(() => {
      if (mounted && mountedRef.current && !isInitialized) {
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

  // Listen for auth state changes
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

      // Handle user authentication
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

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Don't set loading to false until we have user profile
          await fetchUserProfile(newSession.user.id, newSession.user.email);

          // Only set loading to false after profile fetch completes
          if (mountedRef.current) {
            setLoading(false);
          }
        } else {
          // User session exists but no user profile loaded - always fetch to be safe
          await fetchUserProfile(newSession.user.id, newSession.user.email);

          if (mountedRef.current) {
            setLoading(false);
          }
        }
      } else if (!newSession?.user) {
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
        setLoading(false);
        return { error };
      }

      if (!data.session || !data.user) {
        setLoading(false);
        return { error: new AuthError('Failed to establish session', 500) };
      }

      // Set session immediately
      setSession(data.session);

      // Fetch user profile - don't set loading to false until complete
      try {
        await fetchUserProfile(data.user.id, data.user.email!);

        if (mountedRef.current) {
          // Profile loaded successfully, loading will be set to false in fetchUserProfile
          return { error: null };
        }

        // Profile failed to load but auth succeeded
        if (mountedRef.current) {
          setLoading(false);
        }
        return { error: null };
      } catch {
        // Profile fetch failed, but auth succeeded
        if (mountedRef.current) {
          setLoading(false);
        }
        return { error: null };
      }
    } catch (error) {
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
