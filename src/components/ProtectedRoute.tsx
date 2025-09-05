'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';
import { useAppStore } from '@/lib/stores';
import { Card, CardContent } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'admin';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { setError, clearError } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Prevent multiple redirects and checks
  const hasRedirectedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const lastRoleRef = useRef<string | null>(null);

  // Track when initial auth loading is complete
  useEffect(() => {
    if (!loading && !initialLoadComplete) {
      // Give a small delay to ensure auth state is fully settled
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 200); // Increased from 100ms to 200ms for more stability
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, initialLoadComplete]);

  useEffect(() => {
    // Clear any previous errors
    clearError();

    // Reset redirect flag when user changes
    if (lastUserIdRef.current !== user?.id) {
      hasRedirectedRef.current = false;
      lastUserIdRef.current = user?.id || null;
    }

    // Reset role check when role changes
    if (lastRoleRef.current !== user?.role) {
      lastRoleRef.current = user?.role || null;
    }

    // Only proceed with auth checks after initial load is complete
    if (!loading && initialLoadComplete && !hasRedirectedRef.current) {
      if (!user) {
        // User is not authenticated, redirect to login
        setError('Please log in to access this page');
        hasRedirectedRef.current = true;
        // Use setTimeout to defer navigation and avoid render-time setState
        setTimeout(() => {
          router.replace('/auth/login');
        }, 0);
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // User doesn't have the required role
        setError(
          `Access denied. This page requires ${requiredRole} privileges.`
        );
        hasRedirectedRef.current = true;

        // Use setTimeout to defer navigation and avoid render-time setState
        setTimeout(() => {
          // Redirect based on user's actual role
          if (user.role === 'teacher') {
            router.replace('/teacher/dashboard');
          } else if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/dashboard');
          }
        }, 0);
      }

      // User is authenticated and has the required role
      setIsChecking(false);
    }
  }, [
    user,
    loading,
    initialLoadComplete,
    requiredRole,
    router,
    pathname,
    setError,
    clearError,
  ]);

  // Show loading state while checking authentication or during initial load
  if (loading || !initialLoadComplete || isChecking) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              <p className='text-gray-600 dark:text-gray-400 text-center'>
                Verifying access...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we reach here but still don't have a user, show fallback or redirect
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Force redirect to login if we somehow got here without a user
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Use setTimeout to defer navigation and avoid render-time setState
      setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
    }

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              <p className='text-gray-600 dark:text-gray-400 text-center'>
                Redirecting to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show fallback if provided for other scenarios
  if (fallback) {
    return <>{fallback}</>;
  }

  // If we reach here, user is authenticated and has the required role
  return <>{children}</>;
}

// Higher-order component for role-based protection
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: 'teacher' | 'admin'
) {
  return function RoleProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Specific route protection components
export function TeacherRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole='teacher'>{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole='admin'>{children}</ProtectedRoute>;
}

// Public route that redirects authenticated users to their dashboard
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Track when initial auth loading is complete
  useEffect(() => {
    if (!loading && !initialLoadComplete) {
      // Give a small delay to ensure auth state is fully settled
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 200); // Increased for more stability
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, initialLoadComplete]);

  useEffect(() => {
    if (!loading && initialLoadComplete && user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Use setTimeout to defer navigation and avoid render-time setState
      setTimeout(() => {
        // User is authenticated, redirect to appropriate dashboard
        if (user.role === 'teacher') {
          router.replace('/teacher/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      }, 0);
    }
    return undefined;
  }, [user, loading, initialLoadComplete, router]);

  // If we have a user and initial load is complete, don't render children (we're redirecting)
  if (!loading && initialLoadComplete && user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              <p className='text-gray-600 dark:text-gray-400 text-center'>
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !initialLoadComplete) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              <p className='text-gray-600 dark:text-gray-400 text-center'>
                Loading...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
