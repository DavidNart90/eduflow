'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function AdminSettingsPage() {
  const { user, signOut } = useAuth();
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

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Set form data from user context
  useEffect(() => {
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

    setIsLoading(true);
    setMessage('');

    // Validation
    if (!formData.currentPassword) {
      setMessage('Current password is required');
      setIsLoading(false);
      return;
    }

    if (!formData.newPassword) {
      setMessage('New password is required');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setIsLoading(false);
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
        setMessage('Password updated successfully!');
      } else {
        setMessage(result.error || 'Failed to update password');
      }
    } catch {
      setMessage('An error occurred while updating password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setMessage('');

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
        setMessage('Profile updated successfully!');
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
    } catch {
      setMessage('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setMessage('');

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
        setMessage('Successfully logged out from all devices');
        // Use the auth context's signOut method to properly clear the session
        await signOut();
      } else {
        setMessage(result.error || 'Failed to logout from all devices');
      }
    } catch {
      setMessage('An error occurred while logging out from all devices');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AdminRoute>
      <Layout>
        <div className='space-y-6'>
          {/* Page Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Account Settings
              </h1>
              <p className='text-gray-600 dark:text-gray-400'>
                Manage your account settings and preferences
              </p>
            </div>
            <Badge variant='primary'>Profile Management</Badge>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.includes('successfully')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className='flex items-center'>
                <ExclamationTriangleIcon className='h-5 w-5 mr-2' />
                {message}
              </div>
            </div>
          )}

          {/* Personal Information */}
          <Card variant='glass'>
            <CardHeader
              title='Personal Information'
              subtitle='Your profile details registered with the association'
            />
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Full Name
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={e =>
                      handleInputChange('fullName', e.target.value)
                    }
                    placeholder='Administrator Name'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Email Address
                  </label>
                  <Input
                    type='email'
                    value={formData.email}
                    readOnly
                    className='bg-gray-50 dark:bg-gray-800'
                    placeholder='admin@education.gov.gh'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Management Unit
                  </label>
                  <Input
                    value={formData.managementUnit}
                    onChange={e =>
                      handleInputChange('managementUnit', e.target.value)
                    }
                    placeholder='Ghana Education Service Headquarters'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Employee ID
                  </label>
                  <Input
                    value={formData.employeeId}
                    onChange={e =>
                      handleInputChange('employeeId', e.target.value)
                    }
                    placeholder='ADM-2022-0156'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Date Joined
                  </label>
                  <Input
                    value={formData.dateJoined}
                    readOnly
                    className='bg-gray-50 dark:bg-gray-800'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card variant='glass'>
            <CardHeader
              title='Change Password'
              subtitle='Update your password to keep your account secure'
            />
            <CardContent>
              <div className='space-y-4 max-w-md'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('current')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('new')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className='h-5 w-5' />
                      ) : (
                        <EyeIcon className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Password must be at least 8 characters long
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                    />
                    <button
                      type='button'
                      onClick={() => togglePasswordVisibility('confirm')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
                    isLoading
                  }
                  className='w-full'
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card variant='glass'>
            <CardHeader
              title='Email Notifications'
              subtitle="Choose which notifications you'd like to receive"
            />
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-start space-x-3'>
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
                      className='h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary dark:border-gray-600 dark:bg-gray-700'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Mobile Contributions
                    </label>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      Get notified when mobile money contributions are processed
                    </p>
                  </div>
                  {notifications.mobileContributions && (
                    <Badge variant='success' size='sm'>
                      ON
                    </Badge>
                  )}
                </div>
                <div className='flex items-start space-x-3'>
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
                      className='h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary dark:border-gray-600 dark:bg-gray-700'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Monthly Statements
                    </label>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      Receive monthly statement notifications via email
                    </p>
                  </div>
                  {notifications.monthlyStatements && (
                    <Badge variant='success' size='sm'>
                      ON
                    </Badge>
                  )}
                </div>
                <div className='flex items-start space-x-3'>
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
                      className='h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary dark:border-gray-600 dark:bg-gray-700'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Interest Payments
                    </label>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      Get alerted when interest is applied to your account
                    </p>
                  </div>
                  {notifications.interestPayments && (
                    <Badge variant='success' size='sm'>
                      ON
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card variant='glass'>
            <CardHeader
              title='Account Security'
              subtitle='Manage your account security settings'
            />
            <CardContent>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-red-500 mt-0.5' />
                  <div className='flex-1'>
                    <h3 className='text-sm font-medium text-red-800 dark:text-red-300'>
                      Secure Your Account
                    </h3>
                    <p className='text-sm text-red-700 dark:text-red-400 mt-1'>
                      If you suspect unauthorized access, use this option to
                      sign out from all sessions on other devices.
                    </p>
                    <Button
                      variant='error'
                      size='sm'
                      onClick={handleLogoutAllDevices}
                      className='mt-3'
                    >
                      Log out of all other devices
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className='flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700'>
            <Button variant='outline' size='sm'>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className='px-8'
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
