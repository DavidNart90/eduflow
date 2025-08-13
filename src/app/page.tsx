'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PublicRoute } from '@/components/ProtectedRoute';
import { ThemeToggle } from '@/components/ui';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center theme-transition'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PublicRoute>
      <main className='min-h-screen theme-transition'>
        {/* Header with Theme Toggle */}
        <header className='absolute top-0 right-0 p-6 z-10'>
          <ThemeToggle size='lg' />
        </header>

        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-4xl mx-auto text-center'>
            {/* Header */}
            <div className='mb-12'>
              <div className='mx-auto h-24 w-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-6 shadow-lg'>
                <span className='text-4xl font-bold text-white'>EF</span>
              </div>
              <h1 className='text-5xl font-bold gradient-text mb-4'>
                Welcome to EduFlow
              </h1>
              <p className='text-xl text-muted-foreground mb-8'>
                Teachers&apos; Savings Association Management System
              </p>
              <div className='flex justify-center space-x-4'>
                <a
                  href='/auth/login'
                  className='px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md hover:shadow-lg'
                >
                  Sign In
                </a>
                <a
                  href='/auth/forgot-password'
                  className='px-8 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium shadow-md hover:shadow-lg'
                >
                  Forgot Password
                </a>
              </div>
            </div>

            {/* Features */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
              <div className='bg-card text-card-foreground rounded-lg shadow-lg p-6 border border-border hover:shadow-xl transition-shadow'>
                <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-6 h-6 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold mb-2'>
                  Savings Management
                </h3>
                <p className='text-muted-foreground'>
                  Teachers can track their savings, make contributions, and view
                  detailed statements.
                </p>
              </div>

              <div className='bg-card text-card-foreground rounded-lg shadow-lg p-6 border border-border hover:shadow-xl transition-shadow'>
                <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-6 h-6 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold mb-2'>
                  Mobile Money Integration
                </h3>
                <p className='text-muted-foreground'>
                  Seamless mobile money payments for easy contributions and
                  withdrawals.
                </p>
              </div>

              <div className='bg-card text-card-foreground rounded-lg shadow-lg p-6 border border-border hover:shadow-xl transition-shadow'>
                <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-6 h-6 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold mb-2'>
                  Automated Reports
                </h3>
                <p className='text-muted-foreground'>
                  Generate monthly statements and quarterly reports
                  automatically for all members.
                </p>
              </div>
            </div>

            {/* About Section */}
            <div className='bg-card text-card-foreground rounded-lg shadow-lg p-8 border border-border'>
              <h2 className='text-2xl font-bold mb-4'>About EduFlow</h2>
              <p className='text-muted-foreground mb-4'>
                EduFlow is a comprehensive Progressive Web App designed
                specifically for the New Juaben Teachers&apos; Savings
                Association. Our platform provides teachers with easy access to
                their savings information, mobile money integration for
                contributions, and automated reporting for better financial
                management.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
                <div>
                  <h3 className='font-semibold mb-2'>For Teachers</h3>
                  <ul className='text-sm text-muted-foreground space-y-1'>
                    <li>• View real-time savings balance</li>
                    <li>• Make mobile money contributions</li>
                    <li>• Download monthly statements</li>
                    <li>• Track transaction history</li>
                  </ul>
                </div>
                <div>
                  <h3 className='font-semibold mb-2'>For Administrators</h3>
                  <ul className='text-sm text-muted-foreground space-y-1'>
                    <li>• Upload controller reports</li>
                    <li>• Generate quarterly statements</li>
                    <li>• Manage teacher accounts</li>
                    <li>• Monitor system analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicRoute>
  );
}
