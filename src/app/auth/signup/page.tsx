'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function SignupPage() {
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    employeeId: '',
    school: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Validation state
  const [validation, setValidation] = useState({
    email: { isValid: false, message: '' },
    fullName: { isValid: false, message: '' },
    employeeId: { isValid: false, message: '' },
    school: { isValid: false, message: '' },
    phoneNumber: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
  });

  // Real-time validation functions
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setValidation(prev => ({
      ...prev,
      email: {
        isValid,
        message: isValid ? '' : 'Please enter a valid email address',
      },
    }));
  };

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

  const validateEmployeeId = (value: string) => {
    // Employee ID should start with "EMP" or "ADMIN" followed by 3 digits
    const employeeIdRegex = /^(EMP|ADMIN)\d{3}$/;
    const isValid = employeeIdRegex.test(value.toUpperCase());
    setValidation(prev => ({
      ...prev,
      employeeId: {
        isValid,
        message: isValid
          ? 'Employee ID format is valid!'
          : 'Employee ID must start with EMP or ADMIN followed by 3 digits (e.g., EMP001, ADMIN001)',
      },
    }));
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
      case 'email':
        validateEmail(value);
        break;
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
        validation.email.isValid &&
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

  // Clear form function
  const clearForm = () => {
    setFormData({
      email: '',
      fullName: '',
      employeeId: '',
      school: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });

    // Reset validation state
    setValidation({
      email: { isValid: false, message: '' },
      fullName: { isValid: false, message: '' },
      employeeId: { isValid: false, message: '' },
      school: { isValid: false, message: '' },
      phoneNumber: { isValid: false, message: '' },
      password: { isValid: false, message: '' },
      confirmPassword: { isValid: false, message: '' },
    });

    // Go back to first section
    setCurrentSection(1);
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSectionValid(1) || !isSectionValid(2)) {
      setError('Please complete all required fields correctly');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, check if employee ID is already taken
      const employeeIdCheckResponse = await fetch('/api/auth/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: formData.employeeId.toUpperCase(),
        }),
      });

      const employeeIdCheckData = await employeeIdCheckResponse.json();

      if (!employeeIdCheckResponse.ok) {
        setError(employeeIdCheckData.error || 'Failed to check employee ID');
        setLoading(false);
        return;
      }

      // Check if employee ID is already taken first
      if (
        employeeIdCheckData.error &&
        employeeIdCheckData.error.includes('already registered')
      ) {
        setError(
          'This Employee ID is already registered. Please use a different Employee ID.'
        );
        setLoading(false);
        return;
      }

      // Then check if format validation failed
      if (!employeeIdCheckData.valid) {
        setError(
          employeeIdCheckData.message || 'Employee ID validation failed'
        );
        setLoading(false);
        return;
      }

      // Now check if email is already taken
      const emailCheckResponse = await fetch('/api/auth/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          action: 'check-email',
        }),
      });

      const emailCheckData = await emailCheckResponse.json();

      if (!emailCheckResponse.ok) {
        setError(emailCheckData.error || 'Failed to check email');
        setLoading(false);
        return;
      }

      // If email is already taken, show error and stay on form
      if (
        emailCheckData.error &&
        emailCheckData.error.includes('already registered')
      ) {
        setError(
          emailCheckData.message ||
            'An account with this email already exists. Please try logging in instead.'
        );
        setLoading(false);
        return;
      }

      // Determine role based on employee ID
      const role = formData.employeeId.toUpperCase().startsWith('ADMIN')
        ? 'admin'
        : 'teacher';

      // Now proceed with signup since employee ID is available
      const { error } = await signUp(formData.email, formData.password, {
        email: formData.email,
        full_name: formData.fullName,
        role: role,
        employee_id: formData.employeeId.toUpperCase(),
        management_unit: formData.school,
        phone_number: formData.phoneNumber,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError(
            'An account with this email already exists. Please try logging in instead.'
          );
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // If signup successful, now create the user profile
      try {
        const profileResponse = await fetch('/api/auth/verify', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            userData: {
              fullName: formData.fullName,
              employeeId: formData.employeeId.toUpperCase(),
              school: formData.school,
              phoneNumber: formData.phoneNumber,
              role: role,
            },
          }),
        });

        if (!profileResponse.ok) {
          const profileError = await profileResponse.json();
          throw new Error(
            profileError.error || 'Failed to create user profile'
          );
        }

        // Profile created successfully
        setSuccess('Account created successfully! Redirecting to dashboard...');

        // Now confirm the email automatically since we're not using email verification
        try {
          const confirmResponse = await fetch('/api/auth/verify', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              action: 'confirm-email',
            }),
          });

          if (!confirmResponse.ok) {
            // Email confirmation failed, but account was created
          }
        } catch {
          // Email confirmation error occurred
        }

        // Redirect to appropriate dashboard based on role immediately

        // Redirect immediately to avoid race condition with main page routing
        if (role === 'admin') {
          router.replace('/admin/dashboard');
          return;
        }
        router.replace('/teacher/dashboard');
      } catch (profileError) {
        setError(
          `Account created but profile setup failed: ${profileError instanceof Error ? profileError.message : 'Unknown error'}. Please contact support.`
        );

        // Note: The user is now authenticated but profile creation failed
        // They should contact support to complete their setup
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
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

      <div className='max-w-2xl w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 md:h-16 md:w-16 bg-primary-500 rounded-full flex items-center justify-center mb-4 shadow-lg'>
            <span className='text-lg md:text-2xl font-bold text-white'>EF</span>
          </div>

          <h1 className='text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Join EduFlow
          </h1>
          <p className='text-sm md:text-lg text-gray-600 dark:text-gray-300'>
            Create your account
          </p>
        </div>

        {/* Signup Form */}
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-8 space-y-4 md:space-y-6 border border-gray-200 dark:border-gray-700'>
          {success && (
            <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm'>
              {success}
            </div>
          )}

          {/* Progress Indicator */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Step {currentSection} of 2
              </span>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {Math.round((currentSection / 2) * 100)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-purple-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${(currentSection / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='font-medium'>Error</p>
                  <p className='mt-1'>{error}</p>
                </div>
                <button
                  onClick={clearForm}
                  className='ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium'
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className='space-y-6'
            suppressHydrationWarning={true}
          >
            {/* Section 1: Personal Information */}
            {currentSection === 1 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Personal Information
                </h3>

                {/* Email */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Email Address
                  </label>
                  <Input
                    type='email'
                    value={formData.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    className={`w-full ${validation.email.isValid ? 'border-green-500' : validation.email.message ? 'border-red-500' : ''}`}
                    placeholder='Enter your email address'
                  />
                  {validation.email.message && (
                    <p
                      className={`text-xs mt-1 ${validation.email.isValid ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {validation.email.message}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Employee ID
                  </label>
                  <Input
                    type='text'
                    value={formData.employeeId}
                    onChange={e =>
                      handleFieldChange('employeeId', e.target.value)
                    }
                    className={`w-full ${validation.employeeId.isValid ? 'border-green-500' : validation.employeeId.message ? 'border-red-500' : ''}`}
                    placeholder='EMP001 or ADMIN001'
                  />
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
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    School
                  </label>
                  <Input
                    type='text'
                    value={formData.school}
                    onChange={e => handleFieldChange('school', e.target.value)}
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
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Account Security
                </h3>

                {/* Phone Number */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  disabled={loading || !isSectionValid(1) || !isSectionValid(2)}
                  className='px-6'
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className='text-center'>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              Already have an account?{' '}
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
                  className='h-6 w-6 md:h-8 md:w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center'
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
  );
}
