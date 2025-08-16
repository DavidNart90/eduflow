'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  const { user, loading, refreshProfile } = useAuth();
  const { setError, clearError } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [roleRefreshAttempted, setRoleRefreshAttempted] = useState(false);

  useEffect(() => {
    // Clear any previous errors
    clearError();

    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        setError('Please log in to access this page');
        // Use setTimeout to ensure the redirect happens after the current render cycle
        setTimeout(() => {
          router.replace('/auth/login');
        }, 0);
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // If we haven't tried refreshing the profile yet, try once
        if (!roleRefreshAttempted) {
          setRoleRefreshAttempted(true);
          refreshProfile();
          return;
        }

        // User doesn't have the required role after refresh attempt
        setError(
          `Access denied. This page requires ${requiredRole} privileges.`
        );

        // Use setTimeout to ensure the redirect happens after the current render cycle
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
        return;
      }

      // User is authenticated and has the required role
      setIsChecking(false);
    }
  }, [
    user,
    loading,
    requiredRole,
    router,
    pathname,
    setError,
    clearError,
    refreshProfile,
    roleRefreshAttempted,
  ]);

  // Show loading state while checking authentication
  if (loading || isChecking) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              <p className='text-gray-600 dark:text-gray-400 text-center'>
                Verifying your access...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we reach here but still don't have a user, something went wrong - show fallback or redirect again
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Force redirect to login if we somehow got here without a user
    setTimeout(() => {
      router.replace('/auth/login');
    }, 0);

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

  useEffect(() => {
    if (!loading && user) {
      // Use setTimeout to ensure the redirect happens after the current render cycle
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
  }, [user, loading, router]);

  // If we have a user and are not loading, don't render children (we're redirecting)
  if (!loading && user) {
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

  if (loading) {
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
