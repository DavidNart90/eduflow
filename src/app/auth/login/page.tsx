'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth-context-optimized';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { PublicRoute } from '@/components/ProtectedRoute';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, loading: authLoading } = useAuth();

  // Handle auth loading state
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
    } else {
      // Only reset loading if we're not in the middle of a login attempt
      if (!success) {
        setLoading(false);
      }
    }
  }, [authLoading, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!identifier || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Determine if identifier is email or employee ID
      const isEmail = identifier.includes('@');
      let email = identifier;

      if (!isEmail) {
        // If it's an employee ID, we need to find the corresponding email
        // Call our API to get the email for the employee ID (without password for lookup)
        const lookupResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
          }),
        });

        const lookupData = await lookupResponse.json();

        if (!lookupResponse.ok) {
          setError(lookupData.error || 'Invalid employee ID');
          setLoading(false);
          return;
        }

        email = lookupData.user.email;
      }

      // Now authenticate with Supabase using the email
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // Let the auth context handle the redirect
        // The auth state change will trigger the appropriate redirect
        setSuccess('Login successful! Redirecting...');

        // Set a timeout to reset loading state if auth context doesn&apos;t handle it
        setTimeout(() => {
          setLoading(false);
        }, 5000);
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
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
                  d='M12 14l9-5-9-5-9 5 9 5z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className='text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
              Eduflow
            </h1>
            <p className='text-sm md:text-lg text-gray-600 dark:text-gray-300'>
              Teachers&apos; Savings Management
            </p>
          </div>

          {/* Login Card */}
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-8 space-y-4 md:space-y-6 border border-gray-200 dark:border-gray-700'>
            {/* Welcome Message */}
            <div className='text-center'>
              <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1'>
                Welcome to Eduflow
              </h2>
              <p className='text-sm md:text-base text-gray-600 dark:text-gray-300'>
                Sign in to your account
              </p>
            </div>

            {/* Login Form */}
            <form
              className='space-y-4 md:space-y-6'
              onSubmit={handleSubmit}
              suppressHydrationWarning={true}
            >
              {/* Email or Employee ID Field */}
              <div>
                <Input
                  label='Email or Employee ID'
                  type='text'
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder='Enter your email or employee ID'
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

              {/* Password Field */}
              <div>
                <Input
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Enter your password'
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

              {/* Forgot Password Link */}
              <div className='text-right'>
                <a
                  href='/auth/forgot-password'
                  className='text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors'
                >
                  Forgot Password?
                </a>
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

              {/* Sign In Button */}
              <Button
                type='submit'
                variant='primary'
                size='lg'
                loading={loading || authLoading}
                className='w-full'
                disabled={authLoading}
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
                      d='M13 7l5 5m0 0l-5 5m5-5H6'
                    />
                  </svg>
                }
                iconPosition='right'
              >
                {loading || authLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Secure Login Message */}
              <div className='text-center'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Secure login for Teachers and Administrators
                </p>
              </div>
            </form>

            {/* Signup Link */}
            <div className='text-center'>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Don&apos;t have an account?{' '}
                <a
                  href='/auth/signup'
                  className='text-primary-600 hover:text-primary-500 font-medium transition-colors'
                >
                  Sign up here
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className='text-center space-y-4'>
            <p className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
              Powered by FG&B Technologies
            </p>

            {/* Feature Icons */}
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
                      d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  Mobile Friendly
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
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  24/7 Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}
