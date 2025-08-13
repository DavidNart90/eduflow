'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [step, setStep] = useState<'verifying' | 'setup' | 'expired'>(
    'verifying'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  // Form slider state
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    school: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Validation state
  const [validation, setValidation] = useState({
    fullName: { isValid: false, message: '' },
    employeeId: { isValid: false, message: '', isChecking: false },
    school: { isValid: false, message: '' },
    phoneNumber: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fragmentToken, setFragmentToken] = useState<string | null>(null);

  // Get token from query params or URL fragment
  const getTokenFromFragment = () => {
    if (typeof window !== 'undefined') {
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      return (
        params.get('access_token') ||
        params.get('token') ||
        params.get('refresh_token')
      );
    }
    return null;
  };

  // Check for various token formats that Supabase might send
  const token =
    searchParams.get('code') ||
    searchParams.get('token') ||
    searchParams.get('access_token') ||
    searchParams.get('refresh_token') ||
    searchParams.get('error') ||
    searchParams.get('error_description') ||
    getTokenFromFragment() ||
    null;

  const stepParam = searchParams.get('step');

  useEffect(() => {
    // If step parameter is provided, set the step directly
    if (stepParam === 'setup') {
      setStep('setup');
      return;
    }

    // Check for Supabase errors first
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStep('expired');
      setError(`Verification failed: ${errorDescription || error}`);

      // Try to extract email from the current session or URL if available
      if (!email) {
        // Check if we can get email from current session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
        });
      }
      return;
    }

    // Check if we have a token to verify
    const currentToken = token || fragmentToken;
    if (currentToken) {
      // Call verifyToken function inline to avoid dependency issues
      (async (tokenToVerify: string) => {
        setLoading(true);
        setError('');

        try {
          // Check if this is a Supabase email confirmation code (UUID format)
          if (
            tokenToVerify &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              tokenToVerify
            )
          ) {
            // Use Supabase's verifyOtp method for email confirmation codes
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenToVerify,
              type: 'signup',
            });

            if (error) {
              throw new Error(`Email verification failed: ${error.message}`);
            }

            if (data.user) {
              setEmail(data.user.email || '');
              setStep('setup');
              setSuccess(
                'Email verified successfully! Please complete your account setup.'
              );
              return;
            }
            throw new Error('No user data received after verification');
          }

          // If this looks like an access token (JWT), try to authenticate with it first
          if (tokenToVerify && tokenToVerify.includes('.')) {
            const { error } = await supabase.auth.setSession({
              access_token: tokenToVerify,
              refresh_token: '',
            });

            if (error) {
              // If setting session fails, try to decode the JWT to get user info
              try {
                const payload = JSON.parse(atob(tokenToVerify.split('.')[1]));

                if (payload.email) {
                  setEmail(payload.email);
                  setStep('setup');
                  setSuccess(
                    'Email verified successfully! Please complete your account setup.'
                  );
                  return;
                }
              } catch {
                // JWT decode error
              }
            }
            // Check user status after setting session
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();

            if (!sessionError && session?.user) {
              const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });

              const data = await response.json();

              if (response.ok && data.authenticated) {
                if (data.user && data.user.employee_id !== 'PENDING') {
                  router.push('/dashboard');
                  return;
                }
                setEmail(data.user?.email || session.user.email || '');
                setStep('setup');
                setSuccess(
                  'Email verified successfully! Please complete your account setup.'
                );
                return;
              }
            }
            return;
          }

          // If we get here, the token format is not recognized
          throw new Error(
            'Invalid token format. Please use the verification link from your email.'
          );
        } catch (error) {
          setStep('expired');
          setError(
            error instanceof Error
              ? error.message
              : 'Invalid or expired verification token'
          );
        } finally {
          setLoading(false);
        }
      })(currentToken);
      return;
    }

    // If no token, check if user is already authenticated
    // Add a small delay to allow Supabase to process any auth state changes
    setTimeout(() => {
      (async () => {
        setLoading(true);
        setError('');

        try {
          // First, check if we have an active Supabase session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            // Session error occurred
          } else if (session?.user) {
            // Check if user profile exists
            const response = await fetch('/api/auth/verify', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok && data.authenticated) {
              if (data.user && data.user.employee_id !== 'PENDING') {
                router.push('/dashboard');
                return;
              }
              setEmail(data.user?.email || session.user.email || '');
              setStep('setup');
              setSuccess(
                'Email verified successfully! Please complete your account setup.'
              );
              setLoading(false);
              return;
            }
          }

          // If no active session, check if we can get user info from the API
          const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await response.json();

          if (response.ok && data.authenticated) {
            if (data.user && data.user.employee_id !== 'PENDING') {
              router.push('/dashboard');
              return;
            }
            setEmail(data.user?.email || '');
            setStep('setup');
            setSuccess(
              'Email verified successfully! Please complete your account setup.'
            );
            return;
          }
          setStep('expired');
          setError('No verification token provided or session expired');
        } catch {
          setStep('expired');
          setError('Failed to check user status');
        } finally {
          setLoading(false);
        }
      })();
    }, 1000);
  }, [token, stepParam, fragmentToken, email, searchParams, router]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setEmail(session.user.email || '');
        setStep('setup');
        setSuccess(
          'Email verified successfully! Please complete your account setup.'
        );
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setStep('expired');
        setError('Session expired. Please try signing up again.');
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // This might happen during the verification process
        setEmail(session.user.email || '');
        setStep('setup');
        setSuccess(
          'Email verified successfully! Please complete your account setup.'
        );
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const currentTimeout = timeoutRef.current;

    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const fragment = window.location.hash.substring(1);
        if (fragment) {
          const params = new URLSearchParams(fragment);
          const fragmentTokenValue =
            params.get('access_token') ||
            params.get('token') ||
            params.get('refresh_token');
          if (fragmentTokenValue) {
            setFragmentToken(fragmentTokenValue);
          }
        }
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  // Real-time validation functions
  const validateFullName = (value: string) => {
    const isValid = value.trim().length >= 2;
    setValidation(prev => ({
      ...prev,
      fullName: {
        isValid,
        message: isValid ? '' : 'Full name must be at least 2 characters',
      },
    }));
  };

  const validateEmployeeId = async (value: string) => {
    setValidation(prev => ({
      ...prev,
      employeeId: { ...prev.employeeId, isChecking: true },
    }));

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: value }),
      });

      const data = await response.json();
      const isValid = response.ok;

      setValidation(prev => ({
        ...prev,
        employeeId: {
          isValid,
          message: isValid
            ? 'Employee ID verified successfully!'
            : data.error || 'Invalid employee ID',
          isChecking: false,
        },
      }));
    } catch {
      setValidation(prev => ({
        ...prev,
        employeeId: {
          isValid: false,
          message: 'Error checking employee ID',
          isChecking: false,
        },
      }));
    }
  };

  const validateSchool = (value: string) => {
    const isValid = value.trim().length >= 3;
    setValidation(prev => ({
      ...prev,
      school: {
        isValid,
        message: isValid ? '' : 'School name must be at least 3 characters',
      },
    }));
  };

  const validatePhoneNumber = (value: string) => {
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    const isValid = phoneRegex.test(value);
    setValidation(prev => ({
      ...prev,
      phoneNumber: {
        isValid,
        message: isValid ? '' : 'Please enter a valid Ghanaian phone number',
      },
    }));
  };

  const validatePassword = (value: string) => {
    const isValid = value.length >= 6;
    setValidation(prev => ({
      ...prev,
      password: {
        isValid,
        message: isValid ? '' : 'Password must be at least 6 characters',
      },
    }));

    // Also validate confirm password if it has a value
    if (formData.confirmPassword) {
      validateConfirmPassword(formData.confirmPassword, value);
    }
  };

  const validateConfirmPassword = (
    confirmValue: string,
    passwordValue?: string
  ) => {
    const password = passwordValue || formData.password;
    const isValid = confirmValue === password && confirmValue.length >= 6;
    setValidation(prev => ({
      ...prev,
      confirmPassword: {
        isValid,
        message: isValid ? '' : 'Passwords do not match',
      },
    }));
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    switch (field) {
      case 'fullName':
        validateFullName(value);
        break;
      case 'employeeId':
        validateEmployeeId(value);
        break;
      case 'school':
        validateSchool(value);
        break;
      case 'phoneNumber':
        validatePhoneNumber(value);
        break;
      case 'password':
        validatePassword(value);
        break;
      case 'confirmPassword':
        validateConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  // Check if current section is valid
  const isSectionValid = (section: number) => {
    if (section === 1) {
      return (
        validation.fullName.isValid &&
        validation.employeeId.isValid &&
        validation.school.isValid
      );
    }
    return (
      validation.phoneNumber.isValid &&
      validation.password.isValid &&
      validation.confirmPassword.isValid
    );
  };

  // Navigate to next section
  const nextSection = () => {
    if (currentSection === 1 && isSectionValid(1)) {
      setCurrentSection(2);
    }
  };

  // Navigate to previous section
  const prevSection = () => {
    if (currentSection === 2) {
      setCurrentSection(1);
    }
  };

  // Submit the form
  const handleResendVerification = async () => {
    if (!email) {
      setError('No email address available. Please go back to signup.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          action: 'resend-verification',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          'Verification email sent successfully! Please check your inbox.'
        );
        // Reset to verifying state to try again
        setStep('verifying');
        setError('');

        // Clear the success message after a delay
        setTimeout(() => {
          setSuccess('');
        }, 5000);
        return;
      }
      throw new Error(data.error || 'Failed to resend verification email');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to resend verification email'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSectionValid(1) || !isSectionValid(2)) {
      setError('Please complete all required fields correctly');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, create the user profile
      const response = await fetch('/api/auth/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          userData: {
            fullName: formData.fullName,
            employeeId: formData.employeeId,
            school: formData.school,
            phoneNumber: formData.phoneNumber,
            // Don&apos;t send password here - we&apos;ll handle it separately
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Now set the password using the service role
      if (formData.password) {
        const passwordResponse = await fetch('/api/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: formData.password,
          }),
        });

        if (!passwordResponse.ok) {
          // Password setup failed, but account was created
          // Continue anyway - user can reset password later
        }
      }

      setSuccess('Account created successfully! Redirecting to dashboard...');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading && step === 'verifying') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Verifying your email...
            </h2>
            <p className='text-gray-600'>
              Please wait while we verify your account.
            </p>

            {/* Debug info */}
            <div className='mt-4 p-3 bg-gray-100 rounded text-xs text-left'>
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>Token: {token || 'None'}</p>
              <p>Step: {step}</p>
              <p>
                URL:{' '}
                {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render expired state
  if (step === 'expired') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Verification Failed
            </h2>
            <p className='text-gray-600 mb-6'>
              {error || 'Your verification link has expired or is invalid.'}
            </p>

            {/* Resend verification options */}
            <div className='space-y-3'>
              {email && (
                <Button
                  onClick={handleResendVerification}
                  className='w-full'
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}

              <Button
                onClick={() => router.push('/auth/signup')}
                variant='outline'
                className='w-full'
              >
                Sign Up Again
              </Button>
            </div>

            {/* Show email if available */}
            {email && (
              <p className='text-sm text-gray-500 mt-4'>
                We&apos;ll send a new verification email to:{' '}
                <strong>{email}</strong>
              </p>
            )}

            {/* Additional help text */}
            <div className='mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <strong>Note:</strong> If you&apos;re still having issues, you
                can also try:
              </p>
              <ul className='text-sm text-blue-700 mt-2 text-left'>
                <li>• Check your spam/junk folder</li>
                <li>• Wait a few minutes for the email to arrive</li>
                <li>• Use a different email address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render setup form
  if (step === 'setup') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-lg shadow-lg p-8'>
            {/* Header */}
            <div className='text-center mb-8'>
              <div className='w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-6 h-6 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              </div>
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                Complete Your Account
              </h1>
              <p className='text-gray-600'>
                Set up your teacher account details
              </p>
            </div>

            {/* Progress Indicator */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  Step {currentSection} of 2
                </span>
                <span className='text-sm text-gray-500'>
                  {Math.round((currentSection / 2) * 100)}%
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-purple-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${(currentSection / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-green-800 text-sm'>{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-800 text-sm'>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Section 1: Personal Information */}
              {currentSection === 1 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Personal Information
                  </h3>

                  {/* Full Name */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Full Name
                    </label>
                    <Input
                      type='text'
                      value={formData.fullName}
                      onChange={e =>
                        handleFieldChange('fullName', e.target.value)
                      }
                      className={`w-full ${validation.fullName.isValid ? 'border-green-500' : validation.fullName.message ? 'border-red-500' : ''}`}
                      placeholder='Enter your full name'
                    />
                    {validation.fullName.message && (
                      <p
                        className={`text-xs mt-1 ${validation.fullName.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Employee ID
                    </label>
                    <div className='relative'>
                      <Input
                        type='text'
                        value={formData.employeeId}
                        onChange={e =>
                          handleFieldChange('employeeId', e.target.value)
                        }
                        className={`w-full pr-10 ${validation.employeeId.isValid ? 'border-green-500' : validation.employeeId.message && !validation.employeeId.isChecking ? 'border-red-500' : ''}`}
                        placeholder='Enter your employee ID'
                      />
                      {validation.employeeId.isValid && (
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                          <svg
                            className='h-5 w-5 text-green-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      )}
                      {validation.employeeId.isChecking && (
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600'></div>
                        </div>
                      )}
                    </div>
                    {validation.employeeId.message && (
                      <p
                        className={`text-xs mt-1 ${validation.employeeId.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.employeeId.message}
                      </p>
                    )}
                  </div>

                  {/* School */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      School
                    </label>
                    <Input
                      type='text'
                      value={formData.school}
                      onChange={e =>
                        handleFieldChange('school', e.target.value)
                      }
                      className={`w-full ${validation.school.isValid ? 'border-green-500' : validation.school.message ? 'border-red-500' : ''}`}
                      placeholder='Enter your school name'
                    />
                    {validation.school.message && (
                      <p
                        className={`text-xs mt-1 ${validation.school.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.school.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Section 2: Account Security */}
              {currentSection === 2 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Account Security
                  </h3>

                  {/* Phone Number */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Phone Number
                    </label>
                    <Input
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={e =>
                        handleFieldChange('phoneNumber', e.target.value)
                      }
                      className={`w-full ${validation.phoneNumber.isValid ? 'border-green-500' : validation.phoneNumber.message ? 'border-red-500' : ''}`}
                      placeholder='+233 or 0XXXXXXXXX'
                    />
                    {validation.phoneNumber.message && (
                      <p
                        className={`text-xs mt-1 ${validation.phoneNumber.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Password
                    </label>
                    <Input
                      type='password'
                      value={formData.password}
                      onChange={e =>
                        handleFieldChange('password', e.target.value)
                      }
                      className={`w-full ${validation.password.isValid ? 'border-green-500' : validation.password.message ? 'border-red-500' : ''}`}
                      placeholder='Create a strong password'
                    />
                    {validation.password.message && (
                      <p
                        className={`text-xs mt-1 ${validation.password.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className='label block text-sm font-medium text-gray-700 mb-2'>
                      Confirm Password
                    </label>
                    <Input
                      type='password'
                      value={formData.confirmPassword}
                      onChange={e =>
                        handleFieldChange('confirmPassword', e.target.value)
                      }
                      className={`w-full ${validation.confirmPassword.isValid ? 'border-green-500' : validation.confirmPassword.message ? 'border-red-500' : ''}`}
                      placeholder='Confirm your password'
                    />
                    {validation.confirmPassword.message && (
                      <p
                        className={`text-xs mt-1 ${validation.confirmPassword.isValid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {validation.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className='flex justify-between pt-6'>
                {currentSection === 1 ? (
                  <div></div> // Empty div for spacing
                ) : (
                  <Button
                    type='button'
                    onClick={prevSection}
                    variant='outline'
                    className='px-6'
                  >
                    Previous
                  </Button>
                )}

                {currentSection === 1 ? (
                  <Button
                    type='button'
                    onClick={nextSection}
                    disabled={!isSectionValid(1)}
                    className='px-6'
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    disabled={
                      loading || !isSectionValid(1) || !isSectionValid(2)
                    }
                    className='px-6'
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
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
            Please wait while we verify your account
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyForm />
    </Suspense>
  );
}
