'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Please check your inbox.');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative'>
      {/* Theme Toggle - Top Right */}
      <div className='absolute top-4 right-4 z-10'>
        <ThemeToggle size='sm' variant='outline' />
      </div>

      <div className='max-w-md w-full space-y-8'>
        {/* Header with Logo */}
        <div className='text-center'>
          {/* Logo */}
          <div className='mx-auto h-12 w-12 md:h-16 md:w-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg'>
            <svg
              className='h-6 w-6 md:h-8 md:w-8 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className='text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Reset Password
          </h1>
          <p className='text-sm md:text-lg text-gray-600 dark:text-gray-300'>
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Reset Password Card */}
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-8 space-y-4 md:space-y-6 border border-gray-200 dark:border-gray-700'>
          {/* Welcome Message */}
          <div className='text-center'>
            <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1'>
              Forgot Your Password?
            </h2>
            <p className='text-sm md:text-base text-gray-600 dark:text-gray-300'>
              No worries! Enter your email and we{'\u2019'}ll send you a reset
              link.
            </p>
          </div>

          {/* Reset Password Form */}
          <form
            className='space-y-4 md:space-y-6'
            onSubmit={handleSubmit}
            suppressHydrationWarning={true}
          >
            {/* Email Field */}
            <div>
              <Input
                label='Email Address'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Enter your email address'
                leftIcon={
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                    />
                  </svg>
                }
                variant='default'
                sizeVariant='lg'
                required
                suppressHydrationWarning
              />
            </div>

            {/* Success Message */}
            {success && (
              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm'>
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm'>
                {error}
              </div>
            )}

            {/* Send Reset Link Button */}
            <Button
              type='submit'
              variant='primary'
              size='lg'
              loading={loading}
              className='w-full'
              icon={
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              }
              iconPosition='left'
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            {/* Back to Login */}
            <div className='text-center'>
              <Button
                type='button'
                variant='outline'
                size='md'
                onClick={() => router.push('/auth/login')}
                className='w-full'
              >
                Back to Login
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className='text-center'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Remember your password?{' '}
              <a
                href='/auth/login'
                className='text-primary-600 hover:text-primary-500 font-medium transition-colors'
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center space-y-4'>
          <p className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
            Powered by FG&B Technologies
          </p>

          {/* Security Icons */}
          <div className='flex justify-center space-x-6 md:space-x-8'>
            <div className='flex flex-col items-center space-y-1'>
              <div className='h-6 w-6 md:h-8 md:w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center'>
                <svg
                  className='h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              </div>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                Secure
              </span>
            </div>

            <div className='flex flex-col items-center space-y-1'>
              <div className='h-6 w-6 md:h-8 md:w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center'>
                <svg
                  className='h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              </div>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                Protected
              </span>
            </div>

            <div className='flex flex-col items-center space-y-1'>
              <div className='h-6 w-6 md:h-8 md:w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center'>
                <svg
                  className='h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                Reliable
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
