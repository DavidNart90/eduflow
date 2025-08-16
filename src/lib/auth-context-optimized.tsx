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
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import {
  validateAndRefreshTokens,
  isSessionExpiringSoon,
} from './token-validator';

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
  tokenValidation: {
    isValid: boolean;
    lastChecked: number | null;
    isValidating: boolean;
  };
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
  validateSession: () => Promise<boolean>;
  forceTokenRefresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenValidation, setTokenValidation] = useState({
    isValid: false,
    lastChecked: null as number | null,
    isValidating: false,
  });

  // Refs to prevent excessive re-fetches and profile refreshes
  const fetchingRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const profileCacheRef = useRef<{
    [key: string]: { user: AuthUser; timestamp: number };
  }>({});
  const tokenValidationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const TOKEN_VALIDATION_INTERVAL = 2 * 60 * 1000; // Check tokens every 2 minutes

  // Session validation with enhanced error recovery
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (tokenValidation.isValidating) return tokenValidation.isValid;

    setTokenValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await validateAndRefreshTokens();

      setTokenValidation({
        isValid: result.isValid,
        lastChecked: Date.now(),
        isValidating: false,
      });

      if (result.needsRefresh && result.session) {
        setSession(result.session);
        // Clear profile cache to force refresh with new token
        profileCacheRef.current = {};
      }

      if (!result.isValid && result.error) {
        // Session validation failed - clearing auth state
        setSession(null);
        setUser(null);
        profileCacheRef.current = {};
        lastFetchedUserIdRef.current = null;
      }

      return result.isValid;
    } catch {
      // Error validating session - marking as invalid
      setTokenValidation({
        isValid: false,
        lastChecked: Date.now(),
        isValidating: false,
      });
      return false;
    }
  }, [tokenValidation.isValidating, tokenValidation.isValid]);

  // Force token refresh
  const forceTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !refreshedSession) {
        // Force token refresh failed
        return false;
      }

      setSession(refreshedSession);
      setTokenValidation({
        isValid: true,
        lastChecked: Date.now(),
        isValidating: false,
      });

      // Clear profile cache to force refresh with new token
      profileCacheRef.current = {};

      return true;
    } catch {
      // Error forcing token refresh
      return false;
    }
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: string, userEmail?: string, forceRefresh = false) => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current && !forceRefresh) return;

      // Check if session is valid before making API calls
      if (session && isSessionExpiringSoon(session)) {
        const isValid = await validateSession();
        if (!isValid) {
          setUser(null);
          setLoading(false);
          return;
        }
      }

      // Check cache first (skip cache if force refresh or token was recently refreshed)
      const cachedProfile = profileCacheRef.current[userId];
      const cacheValid =
        cachedProfile &&
        Date.now() - cachedProfile.timestamp < PROFILE_CACHE_DURATION &&
        !forceRefresh;

      if (cacheValid) {
        setUser(cachedProfile.user);
        lastFetchedUserIdRef.current = userId;
        setLoading(false);
        return;
      }

      // Prevent fetching the same user profile multiple times within a short period
      if (!forceRefresh && lastFetchedUserIdRef.current === userId && user) {
        setLoading(false);
        return;
      }

      fetchingRef.current = true;

      try {
        if (!userId) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Use email from parameter or session
        const email = userEmail || session?.user?.email || null;

        if (!email) {
          // Create a basic profile even without email
          const basicUser: AuthUser = {
            id: userId,
            email: 'unknown@eduflow.com',
            full_name: 'Unknown User',
            role: 'teacher',
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
            phone_number: undefined,
          };

          setUser(basicUser);
          profileCacheRef.current[userId] = {
            user: basicUser,
            timestamp: Date.now(),
          };
          lastFetchedUserIdRef.current = userId;
          setLoading(false);
          return;
        }

        // Fetch user profile from API endpoint using service role
        const response = await fetch(
          `/api/auth/profile?email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: session?.access_token
                ? `Bearer ${session.access_token}`
                : '',
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          // If user not found, create a basic profile
          if (response.status === 404) {
            const basicUser: AuthUser = {
              id: userId,
              email,
              full_name: email.split('@')[0],
              role: 'teacher',
              employee_id: 'PENDING',
              management_unit: 'Demo Unit',
              phone_number: undefined,
            };

            setUser(basicUser);
            profileCacheRef.current[userId] = {
              user: basicUser,
              timestamp: Date.now(),
            };
            lastFetchedUserIdRef.current = userId;
            setLoading(false);
            return;
          }

          throw new Error(result.error || 'Failed to fetch user profile');
        }

        setUser(result.user);
        profileCacheRef.current[userId] = {
          user: result.user,
          timestamp: Date.now(),
        };
        lastFetchedUserIdRef.current = userId;
      } catch {
        // Error fetching user profile - using fallback
        setUser(null);
        if (userEmail) {
          const basicUser: AuthUser = {
            id: userId,
            email: userEmail,
            full_name: userEmail.split('@')[0],
            role: 'teacher',
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
            phone_number: undefined,
          };

          setUser(basicUser);
          profileCacheRef.current[userId] = {
            user: basicUser,
            timestamp: Date.now(),
          };
          lastFetchedUserIdRef.current = userId;
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [session, user, PROFILE_CACHE_DURATION, validateSession]
  );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          // Error getting session - will retry
          setLoading(false);
          return;
        }

        setSession(session);
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch {
        // Error initializing auth - will retry
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes with optimized handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle sign out event specifically
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        lastFetchedUserIdRef.current = null;
        profileCacheRef.current = {}; // Clear cache
        setLoading(false);
        return;
      }

      setSession(session);

      if (session?.user?.id) {
        // Only fetch profile if it's a new user or forced refresh
        const shouldFetchProfile =
          event === 'SIGNED_IN' ||
          lastFetchedUserIdRef.current !== session.user.id ||
          !profileCacheRef.current[session.user.id];

        if (shouldFetchProfile) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } else {
        setUser(null);
        lastFetchedUserIdRef.current = null;
        setLoading(false);
      }
    });

    initializeAuth();

    // Set up periodic token validation
    if (session) {
      tokenValidationIntervalRef.current = setInterval(async () => {
        await validateSession();
      }, TOKEN_VALIDATION_INTERVAL);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (tokenValidationIntervalRef.current) {
        clearInterval(tokenValidationIntervalRef.current);
      }
    };
  }, [fetchUserProfile, validateSession, TOKEN_VALIDATION_INTERVAL, session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setLoading(false);
      setTokenValidation({
        isValid: false,
        lastChecked: null,
        isValidating: false,
      });
      lastFetchedUserIdRef.current = null;
      fetchingRef.current = false;
      profileCacheRef.current = {};

      // Clear token validation interval
      if (tokenValidationIntervalRef.current) {
        clearInterval(tokenValidationIntervalRef.current);
        tokenValidationIntervalRef.current = null;
      }

      // Check if there's actually a session to sign out from
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing!') {
          // Error signing out - continuing with cleanup
        }
      }

      // Clear all possible Supabase storage keys
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });

        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            sessionStorage.removeItem(key);
          }
        });
      }

      router.replace('/auth/login');
    } catch {
      // Error during sign out - clearing state and redirecting

      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      setLoading(false);
      setTokenValidation({
        isValid: false,
        lastChecked: null,
        isValidating: false,
      });
      lastFetchedUserIdRef.current = null;
      fetchingRef.current = false;
      profileCacheRef.current = {};

      if (tokenValidationIntervalRef.current) {
        clearInterval(tokenValidationIntervalRef.current);
        tokenValidationIntervalRef.current = null;
      }

      router.replace('/auth/login');
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

      if (error) {
        return { error };
      }

      return { error: null };
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

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Update cache
      profileCacheRef.current[user.id] = {
        user: updatedUser,
        timestamp: Date.now(),
      };
    }

    return { error };
  };

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    // Validate session before refreshing profile
    const isValid = await validateSession();
    if (!isValid) return;

    // Clear cache for this user to force fresh fetch
    delete profileCacheRef.current[session.user.id];
    lastFetchedUserIdRef.current = null;
    setLoading(true);
    await fetchUserProfile(session.user.id, session.user.email, true);
  }, [
    session?.user?.id,
    session?.user?.email,
    validateSession,
    fetchUserProfile,
  ]);

  const value = {
    user,
    session,
    loading,
    tokenValidation,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    refreshProfile,
    validateSession,
    forceTokenRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
