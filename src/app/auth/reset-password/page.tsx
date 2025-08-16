'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import ThemeToggle from '@/components/ui/ThemeToggle';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from URL parameters
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Check if we have the required parameters
    if (!token || type !== 'recovery') {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call the reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess('Password reset successfully! Redirecting to login...');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
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
            Enter your new password
          </p>
        </div>

        {/* Reset Password Card */}
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-8 space-y-4 md:space-y-6 border border-gray-200 dark:border-gray-700'>
          {/* Welcome Message */}
          <div className='text-center'>
            <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1'>
              Set New Password
            </h2>
            <p className='text-sm md:text-base text-gray-600 dark:text-gray-300'>
              Choose a strong password for your account
            </p>
          </div>

          {/* Reset Password Form */}
          <form
            className='space-y-4 md:space-y-6'
            onSubmit={handleSubmit}
            suppressHydrationWarning={true}
          >
            {/* New Password Field */}
            <div>
              <Input
                label='New Password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your new password'
                rightIcon={
                  <div
                    className='cursor-pointer text-gray-400 hover:text-gray-600 transition-colors'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
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
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                        />
                      </svg>
                    ) : (
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
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      </svg>
                    )}
                  </div>
                }
                rightIconInteractive={true}
                variant='default'
                sizeVariant='lg'
                required
                suppressHydrationWarning
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <Input
                label='Confirm New Password'
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
                rightIcon={
                  <div
                    className='cursor-pointer text-gray-400 hover:text-gray-600 transition-colors'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                        />
                      </svg>
                    ) : (
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
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      </svg>
                    )}
                  </div>
                }
                rightIconInteractive={true}
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

            {/* Reset Password Button */}
            <Button
              type='submit'
              variant='primary'
              size='lg'
              loading={loading}
              disabled={!token || type !== 'recovery'}
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
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              }
              iconPosition='left'
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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

function LoadingFallback() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 md:h-16 md:w-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          </div>
          <h1 className='text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Loading...
          </h1>
          <p className='text-sm md:text-lg text-gray-600 dark:text-gray-300'>
            Please wait while we load the reset form
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
