'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [maxLoadingReached, setMaxLoadingReached] = useState(false);
  const [showRefreshOption, setShowRefreshOption] = useState(false);

  // Maximum loading timeout - prevent infinite loading
  useEffect(() => {
    // Shorter timeout in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const maxLoadingTime = isDev ? 5000 : 8000; // 5s in dev, 8s in prod
    const refreshOptionTime = isDev ? 3000 : 6000; // 3s in dev, 6s in prod

    const maxLoadingTimer = setTimeout(() => {
      setMaxLoadingReached(true);
    }, maxLoadingTime);

    // Show refresh option earlier in development
    const refreshOptionTimer = setTimeout(() => {
      setShowRefreshOption(true);
    }, refreshOptionTime);

    return () => {
      clearTimeout(maxLoadingTimer);
      clearTimeout(refreshOptionTimer);
    };
  }, []);

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

        {/* Refresh option after 6 seconds */}
        {showRefreshOption && (
          <div className='mt-8 space-y-3'>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              Taking longer than usual?
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium'
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
