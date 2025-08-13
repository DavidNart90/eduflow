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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const router = useRouter();

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) {
        return;
      }

      // Prevent fetching the same user profile multiple times
      if (lastFetchedUserIdRef.current === userId && user) {
        setLoading(false);
        return;
      }

      fetchingRef.current = true;
      let userEmail: string | null = null;

      try {
        // Check if we have a valid user ID
        if (!userId) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get email from session or try to get it from current session
        userEmail = session?.user?.email || null;
        if (!userEmail) {
          // Try to get email from the current session
          try {
            const {
              data: { session: currentSession },
              error,
            } = await supabase.auth.getSession();

            if (error) {
              // Error getting current session
            } else {
              userEmail = currentSession?.user?.email || null;
            }
          } catch {
            // Error getting current session
          }
        }

        if (!userEmail) {
          // No email found in session
          // Create a basic profile even without email
          const basicUser: AuthUser = {
            id: userId,
            email: 'unknown@eduflow.com',
            full_name: 'Unknown User',
            role: 'teacher', // Default fallback, will be updated when profile is fetched
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
            phone_number: undefined,
          };
          setUser(basicUser);
          lastFetchedUserIdRef.current = userId;
          setLoading(false);
          return;
        }

        // Fetch user profile from API endpoint using service role
        const response = await fetch(
          `/api/auth/profile?email=${encodeURIComponent(userEmail)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          // Error fetching user profile

          // If user not found, create a basic profile
          if (response.status === 404) {
            const basicUser: AuthUser = {
              id: userId,
              email: userEmail,
              full_name: userEmail.split('@')[0],
              role: 'teacher', // Default role, will be updated when actual profile is fetched
              employee_id: 'PENDING',
              management_unit: 'Demo Unit',
              phone_number: undefined,
            };

            setUser(basicUser);
            lastFetchedUserIdRef.current = userId;
            setLoading(false);
            return;
          }

          throw new Error(result.error || 'Failed to fetch user profile');
        }

        setUser(result.user);
        lastFetchedUserIdRef.current = userId;
      } catch {
        // Error fetching user profile

        // Create a basic profile even if there's an exception
        if (userEmail) {
          const basicUser: AuthUser = {
            id: userId,
            email: userEmail,
            full_name: userEmail.split('@')[0],
            role: 'teacher', // Default role, will be updated when actual profile is fetched
            employee_id: 'PENDING',
            management_unit: 'Demo Unit',
            phone_number: undefined,
          };

          setUser(basicUser);
          lastFetchedUserIdRef.current = userId;
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [session?.user?.email, user] // Include user dependency since it's used in the function
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
          setLoading(false);
          return;
        }

        setSession(session);
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user?.id) {
        // Only fetch profile if it's a different user or we don't have user data yet
        if (lastFetchedUserIdRef.current !== session.user.id) {
          await fetchUserProfile(session.user.id);
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      setLoading(false);

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Redirect to login page
      router.push('/auth/login');
    } catch {
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      setLoading(false);
      router.push('/auth/login');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<AuthUser>
  ) => {
    try {
      // Sign up the user directly without email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Note: Profile creation is now handled in the signup form
        // This prevents creating incomplete user profiles
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
      setUser({ ...user, ...updates });
    }

    return { error };
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
