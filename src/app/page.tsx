'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Use setTimeout to ensure the redirect happens after the current render cycle
      setTimeout(() => {
        if (user) {
          // Redirect authenticated users to their appropriate dashboard
          if (user.role === 'teacher') {
            router.replace('/teacher/dashboard');
          } else if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/dashboard');
          }
        } else {
          // Redirect unauthenticated users to login page
          router.replace('/auth/login');
        }
      }, 0);
    }
  }, [user, loading, router]);

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
          Teachers&apos Savings Association Management System
        </p>
      </div>
    </div>
  );
}
