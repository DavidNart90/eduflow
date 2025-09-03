'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-optimized';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Input, Badge } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    managementUnit: '',
    employeeId: '',
    dateJoined: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    mobileContributions: true,
    monthlyStatements: true,
    interestPayments: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Set form data from user context
  useEffect(() => {
    const loadUserData = () => {
      try {
        setIsLoading(true);

        // Simulate API call for loading admin settings
        setTimeout(() => {
          if (user) {
            setFormData({
              fullName: user.full_name || '',
              email: user.email || '',
              managementUnit: user.management_unit || '',
              employeeId: user.employee_id || '',
              dateJoined: user.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
          }
          setIsLoading(false);
        }, 3000);
      } catch {
        if (user) {
          setFormData({
            fullName: user.full_name || '',
            email: user.email || '',
            managementUnit: user.management_unit || '',
            employeeId: user.employee_id || '',
            dateJoined: user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const handleUpdatePassword = async () => {
    if (!user?.email) return;

    setIsSubmitting(true);

    // Validation
    if (!formData.currentPassword) {
      showError('Validation Error', 'Current password is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.newPassword) {
      showError('Validation Error', 'New password is required');
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      showError(
        'Validation Error',
        'Password must be at least 8 characters long'
      );
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showError('Validation Error', 'Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear password fields on success
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        showSuccess(
          'Password Updated',
          'Your admin password has been updated successfully'
        );
      } else {
        showError('Update Failed', result.error || 'Failed to update password');
      }
    } catch {
      showError('Update Failed', 'An error occurred while updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.email) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          fullName: formData.fullName,
          managementUnit: formData.managementUnit,
          employeeId: formData.employeeId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          'Profile Updated',
          'Your admin profile has been updated successfully'
        );
      } else {
        showError('Update Failed', result.error || 'Failed to update profile');
      }
    } catch {
      showError('Update Failed', 'An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!user?.email) return;

    setIsSubmitting(true);

    try {
      // Call the logout API endpoint
      const response = await fetch('/api/auth/logout-all-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          'Security Action Complete',
          'Successfully logged out from all devices'
        );
        // Use the auth context's signOut method to properly clear the session
        await signOut();
      } else {
        showError(
          'Logout Failed',
          result.error || 'Failed to logout from all devices'
        );
      }
    } catch {
      showError(
        'Logout Failed',
        'An error occurred while logging out from all devices'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminRoute>
        <Layout>
          <div className='p-4 md:p-6 min-h-screen'>
            {/* Loading State */}
            <div className='space-y-8'>
              {/* Header Skeleton */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={320}
                      height={40}
                      animation='pulse'
                      className='rounded-lg mb-3'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={360}
                      height={20}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={100}
                    height={32}
                    animation='pulse'
                    className='rounded-full'
                  />
                </div>
              </div>

              {/* Settings Cards Skeleton */}
              <div className='space-y-6'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={index}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6'>
                      <div className='space-y-6'>
                        {/* Card Header */}
                        <div className='flex items-center space-x-4 mb-6'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={48}
                            height={48}
                            animation='pulse'
                            className='rounded-full'
                          />
                          <div className='flex-1'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={220}
                              height={24}
                              animation='pulse'
                              className='rounded-lg mb-2'
                            />
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={300}
                              height={16}
                              animation='pulse'
                              className='rounded-lg'
                            />
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {Array.from({
                            length: index === 0 ? 5 : index === 1 ? 3 : 3,
                          }).map((_, fieldIndex) => (
                            <div key={fieldIndex}>
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={120}
                                height={16}
                                animation='pulse'
                                className='rounded mb-2'
                              />
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={'100%'}
                                height={40}
                                animation='pulse'
                                className='rounded-lg'
                              />
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className='flex space-x-3 pt-4'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={120}
                            height={36}
                            animation='pulse'
                            className='rounded-lg'
                          />
                          {index === 3 && (
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={80}
                              height={36}
                              animation='pulse'
                              className='rounded-lg'
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Layout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Layout>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-6'>
            {/* Header */}
            <div className='mb-6 md:mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='lg:w-full'>
                  <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                    Admin Settings & Configuration
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                    System Administration Panel
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                    Manage administrative account settings, security, and system
                    preferences
                  </p>
                </div>
                <Badge
                  variant='error'
                  className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  icon={<CogIcon className='h-4 w-4' />}
                >
                  Administrator
                </Badge>
              </div>
            </div>

            {/* Personal Information */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center space-x-4 mb-6'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                      <UserCircleIcon className='h-6 w-6' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                      Administrator Information
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 text-sm'>
                      Your administrative profile details and credentials
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Full Name
                    </label>
                    <Input
                      value={formData.fullName}
                      onChange={e =>
                        handleInputChange('fullName', e.target.value)
                      }
                      placeholder='Administrator Name'
                      variant='filled'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Email Address
                    </label>
                    <Input
                      type='email'
                      value={formData.email}
                      readOnly
                      className='bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
                      placeholder='admin@education.gov.gh'
                      variant='filled'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Management Unit
                    </label>
                    <Input
                      value={formData.managementUnit}
                      onChange={e =>
                        handleInputChange('managementUnit', e.target.value)
                      }
                      placeholder='Ghana Education Service Headquarters'
                      variant='filled'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Employee ID
                    </label>
                    <Input
                      value={formData.employeeId}
                      onChange={e =>
                        handleInputChange('employeeId', e.target.value)
                      }
                      placeholder='ADM-2022-0156'
                      variant='filled'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Date Joined
                    </label>
                    <Input
                      value={formData.dateJoined}
                      readOnly
                      className='bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
                      variant='filled'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center space-x-4 mb-6'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
                      <KeyIcon className='h-6 w-6' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                      Admin Password Security
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 text-sm'>
                      Update your administrative password to maintain system
                      security
                    </p>
                  </div>
                </div>

                <div className='space-y-4 max-w-md'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Current Password
                    </label>
                    <div className='relative'>
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={e =>
                          handleInputChange('currentPassword', e.target.value)
                        }
                        placeholder='Enter current password'
                        variant='filled'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('current')}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className='h-5 w-5' />
                        ) : (
                          <EyeIcon className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      New Password
                    </label>
                    <div className='relative'>
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={e =>
                          handleInputChange('newPassword', e.target.value)
                        }
                        placeholder='Enter new password'
                        variant='filled'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('new')}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className='h-5 w-5' />
                        ) : (
                          <EyeIcon className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                      Administrative password must be at least 8 characters long
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Confirm New Password
                    </label>
                    <div className='relative'>
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={e =>
                          handleInputChange('confirmPassword', e.target.value)
                        }
                        placeholder='Confirm new password'
                        variant='filled'
                      />
                      <button
                        type='button'
                        onClick={() => togglePasswordVisibility('confirm')}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className='h-5 w-5' />
                        ) : (
                          <EyeIcon className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={
                      !formData.currentPassword ||
                      !formData.newPassword ||
                      !formData.confirmPassword ||
                      isSubmitting
                    }
                    className='w-full'
                    variant='primary'
                  >
                    {isSubmitting ? 'Updating...' : 'Update Admin Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center space-x-4 mb-6'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
                      <BellIcon className='h-6 w-6' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                      System Notifications
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 text-sm'>
                      Configure administrative alerts and system notifications
                    </p>
                  </div>
                </div>

                <div className='space-y-6'>
                  <div className='flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-200/50 dark:border-slate-700/50'>
                    <div className='flex items-center h-5'>
                      <input
                        type='checkbox'
                        checked={notifications.mobileContributions}
                        onChange={e =>
                          handleNotificationChange(
                            'mobileContributions',
                            e.target.checked
                          )
                        }
                        className='h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
                      />
                    </div>
                    <div className='flex-1'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        System Contribution Alerts
                      </label>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Get notified about all mobile money contributions
                        system-wide
                      </p>
                    </div>
                    {notifications.mobileContributions && (
                      <Badge
                        variant='success'
                        size='sm'
                        className='flex items-center'
                      >
                        <DevicePhoneMobileIcon className='h-3 w-3 mr-1' />
                        ACTIVE
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-200/50 dark:border-slate-700/50'>
                    <div className='flex items-center h-5'>
                      <input
                        type='checkbox'
                        checked={notifications.monthlyStatements}
                        onChange={e =>
                          handleNotificationChange(
                            'monthlyStatements',
                            e.target.checked
                          )
                        }
                        className='h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
                      />
                    </div>
                    <div className='flex-1'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        Statement Generation Reports
                      </label>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Receive notifications when monthly statements are
                        generated
                      </p>
                    </div>
                    {notifications.monthlyStatements && (
                      <Badge
                        variant='success'
                        size='sm'
                        className='flex items-center'
                      >
                        <BellIcon className='h-3 w-3 mr-1' />
                        ACTIVE
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-200/50 dark:border-slate-700/50'>
                    <div className='flex items-center h-5'>
                      <input
                        type='checkbox'
                        checked={notifications.interestPayments}
                        onChange={e =>
                          handleNotificationChange(
                            'interestPayments',
                            e.target.checked
                          )
                        }
                        className='h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
                      />
                    </div>
                    <div className='flex-1'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        Interest Calculation Alerts
                      </label>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Get alerted when quarterly interest calculations are
                        processed
                      </p>
                    </div>
                    {notifications.interestPayments && (
                      <Badge
                        variant='success'
                        size='sm'
                        className='flex items-center'
                      >
                        <BellIcon className='h-3 w-3 mr-1' />
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center space-x-4 mb-6'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg'>
                      <ShieldCheckIcon className='h-6 w-6' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                      System Security
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 text-sm'>
                      Administrative security controls and session management
                    </p>
                  </div>
                </div>

                <div className='bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl p-6'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0'>
                      <ExclamationTriangleIcon className='h-6 w-6 text-red-500 mt-0.5' />
                    </div>
                    <div className='flex-1'>
                      <h4 className='text-lg font-semibold text-red-800 dark:text-red-300 mb-2'>
                        Critical Security Action
                      </h4>
                      <p className='text-sm text-red-700 dark:text-red-400 mb-4 leading-relaxed'>
                        If you suspect unauthorized access to the administrative
                        system, use this emergency option to sign out from all
                        sessions on other devices. This will force a re-login on
                        all devices except the current one.
                      </p>
                      <Button
                        variant='error'
                        size='md'
                        onClick={handleLogoutAllDevices}
                        disabled={isSubmitting}
                        className='font-medium'
                        icon={<ShieldCheckIcon className='h-4 w-4' />}
                      >
                        {isSubmitting
                          ? 'Securing system...'
                          : 'Emergency: Log out all devices'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Changes */}
            <div className='flex justify-end items-center pt-6 border-t border-slate-200/50 dark:border-slate-700/50'>
              <div className='flex space-x-4'>
                <Button variant='outline' size='md' className='px-6'>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  variant='primary'
                  size='md'
                  className='px-8'
                >
                  {isSubmitting ? 'Saving...' : 'Save Admin Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
