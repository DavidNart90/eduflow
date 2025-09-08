'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';
import { sessionManager } from '@/lib/auth-session-manager';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [maxLoadingReached, setMaxLoadingReached] = useState(false);
  const [showRefreshOption, setShowRefreshOption] = useState(false);

  // Maximum loading timeout with more aggressive handling
  useEffect(() => {
    // Use more aggressive timeouts to prevent infinite loading
    const maxLoadingTime = 6000; // Reduced to 6 seconds
    const refreshOptionTime = 4000; // Show refresh option after 4 seconds
    const forceCompleteTime = 8000; // Force completion after 8 seconds

    const maxLoadingTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn('Max loading time reached, forcing completion');
      setMaxLoadingReached(true);
    }, maxLoadingTime);

    const refreshOptionTimer = setTimeout(() => {
      setShowRefreshOption(true);
    }, refreshOptionTime);

    // Force completion timer as last resort
    const forceCompleteTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(
        'FORCE COMPLETE: Auth loading took too long, forcing redirect'
      );
      setMaxLoadingReached(true);
      // Force redirect based on current state
      if (user) {
        if (user.role === 'teacher') {
          router.replace('/teacher/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/auth/login');
      }
    }, forceCompleteTime);

    return () => {
      clearTimeout(maxLoadingTimer);
      clearTimeout(refreshOptionTimer);
      clearTimeout(forceCompleteTimer);
    };
  }, [user, router]);

  useEffect(() => {
    if (!loading || maxLoadingReached) {
      if (user) {
        // Redirect authenticated users to their appropriate dashboard immediately
        if (user.role === 'teacher') {
          router.replace('/teacher/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        // Redirect unauthenticated users to login page immediately
        router.replace('/auth/login');
      }
    }
  }, [user, loading, maxLoadingReached, router]);

  // Early redirect - if we already know the auth state, redirect immediately
  if (!loading || maxLoadingReached) {
    if (user) {
      // For authenticated users, show minimal loading while redirecting
      return (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900'>
          <div className='text-center space-y-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='text-slate-600 dark:text-slate-400 font-medium'>
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      );
    }

    // For unauthenticated users, show minimal loading while redirecting
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='text-slate-600 dark:text-slate-400 font-medium'>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900'>
      <div className='text-center space-y-6'>
        {/* EduFlow Logo */}
        <div className='mx-auto h-16 w-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg'>
          <span className='text-2xl font-bold dark:text-white text-primary-500'>
            EF
          </span>
        </div>

        {/* Loading Spinner */}
        <div className='flex items-center justify-center space-x-3'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <p className='text-slate-600 dark:text-slate-400 font-medium'>
            Loading EduFlow...
          </p>
        </div>

        {/* Subtitle */}
        <p className='text-sm text-slate-500 dark:text-slate-500'>
          New Juaben Teachers Savings Association Management System
        </p>

        {/* Advanced refresh options after loading issues */}
        {showRefreshOption && (
          <div className='mt-8 space-y-4'>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              Taking longer than usual?
            </p>
            <div className='flex flex-col gap-2'>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium'
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  sessionManager.clearAllAuthData();
                  window.location.reload();
                }}
                className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium'
              >
                Clear Cache & Reset
              </button>
            </div>
            <p className='text-xs text-slate-400 dark:text-slate-500'>
              If the app keeps loading, try &quot;Clear Cache & Refresh&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
