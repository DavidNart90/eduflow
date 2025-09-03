'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth-context-optimized';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeftIcon,
  CogIcon,
  PercentBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface InterestSetting {
  id: string;
  interest_rate: number;
  payment_frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user: {
    full_name: string;
    email: string;
  };
}

export default function InterestSettingsPage() {
  const router = useRouter();
  const { validateSession } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add refs to prevent multiple simultaneous calls and infinite loops
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const [activeSetting, setActiveSetting] = useState<InterestSetting | null>(
    null
  );
  const [allSettings, setAllSettings] = useState<InterestSetting[]>([]);

  const [formData, setFormData] = useState({
    interest_rate: '',
    payment_frequency: 'quarterly',
  });

  // Fetch interest settings
  const fetchSettings = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current || !mountedRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);

      // Validate session before making API call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        showError('Session Expired', 'Please refresh the page or log in again');
        return;
      }

      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        showError(
          'Authentication Required',
          'Please refresh the page or log in again'
        );
        return;
      }

      const response = await fetch('/api/admin/interest-settings', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }

      const data = await response.json();

      if (data.success) {
        setActiveSetting(data.active_setting);
        setAllSettings(data.all_settings);

        // Set form data from active setting
        if (data.active_setting) {
          setFormData({
            interest_rate: (data.active_setting.interest_rate * 100).toFixed(2),
            payment_frequency: data.active_setting.payment_frequency,
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load settings';
      showError('Loading Failed', errorMessage);
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [validateSession, showError]); // Include dependencies

  useEffect(() => {
    // Set mounted to true and fetch settings once on mount
    mountedRef.current = true;
    fetchSettings();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount, ignore fetchSettings to prevent loops

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Validate input
      const rate = parseFloat(formData.interest_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        showError(
          'Validation Error',
          'Interest rate must be between 0 and 100'
        );
        return;
      }

      // Validate session before making API call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        showError('Session Expired', 'Please refresh the page or log in again');
        return;
      }

      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        showError(
          'Authentication Required',
          'Please refresh the page or log in again'
        );
        return;
      }

      const response = await fetch('/api/admin/interest-settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interest_rate: rate / 100, // Convert percentage to decimal
          payment_frequency: formData.payment_frequency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();

      if (data.success) {
        showSuccess(
          'Settings Updated',
          'Interest settings updated successfully!'
        );
        // Refresh settings
        fetchSettings();
      } else {
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update settings';
      showError('Update Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(2);
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Header */}
          <div className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='lg:w-full'>
                <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                  Interest Rate Settings
                </h1>
                <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                  Manage interest rates and payment frequency for the savings
                  association
                </p>
              </div>
              <Badge
                variant='primary'
                className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
              >
                Admin
              </Badge>
            </div>
          </div>

          <div className='max-w-4xl mx-auto'>
            {isLoading ? (
              /* Loading States */
              <div className='space-y-6'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card
                    key={i}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={200}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Current Active Setting */}
                {activeSetting && (
                  <Card
                    variant='glass'
                    className='border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center'>
                          <CheckCircleIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
                        </div>
                        <div>
                          <h2 className='text-xl font-semibold text-green-900 dark:text-green-100'>
                            Current Active Settings
                          </h2>
                          <p className='text-green-700 dark:text-green-300 text-sm'>
                            Last updated: {formatDate(activeSetting.updated_at)}
                          </p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-800'>
                          <div className='flex items-center gap-2 mb-2'>
                            <PercentBadgeIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                            <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                              Interest Rate
                            </span>
                          </div>
                          <div className='text-2xl font-bold text-green-900 dark:text-green-100'>
                            {formatPercentage(activeSetting.interest_rate)}%
                          </div>
                        </div>

                        <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-800'>
                          <div className='flex items-center gap-2 mb-2'>
                            <ClockIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                            <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                              Payment Frequency
                            </span>
                          </div>
                          <div className='text-2xl font-bold text-green-900 dark:text-green-100 capitalize'>
                            {activeSetting.payment_frequency}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Update Settings Form */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center'>
                        <CogIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                      </div>
                      <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                        Update Interest Settings
                      </h2>
                    </div>

                    <form onSubmit={handleSubmit} className='space-y-6'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Interest Rate */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Interest Rate (%)
                          </label>
                          <Input
                            type='number'
                            name='interest_rate'
                            value={formData.interest_rate}
                            onChange={handleInputChange}
                            placeholder='4.25'
                            step='0.01'
                            min='0'
                            max='100'
                            required
                            className='w-full'
                          />
                          <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                            Enter rate as percentage (e.g., 4.25 for 4.25%)
                          </p>
                        </div>

                        {/* Payment Frequency */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Payment Frequency
                          </label>
                          <select
                            name='payment_frequency'
                            value={formData.payment_frequency}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                            required
                          >
                            <option value='quarterly'>
                              Quarterly (4 times/year)
                            </option>
                            <option value='semi-annual'>
                              Semi-Annual (2 times/year)
                            </option>
                            <option value='annual'>Annual (1 time/year)</option>
                          </select>
                        </div>
                      </div>

                      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                        <div className='text-sm text-blue-800 dark:text-blue-200'>
                          <p className='font-medium mb-2'>Important Notes:</p>
                          <ul className='list-disc list-inside space-y-1'>
                            <li>
                              Changing settings will create a new configuration
                              and deactivate the current one
                            </li>
                            <li>
                              New rates will apply to future interest
                              calculations only
                            </li>
                            <li>
                              All changes are logged and cannot be deleted
                            </li>
                            <li>
                              Make sure to coordinate with the association
                              before making changes
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className='flex gap-4'>
                        <Button
                          type='submit'
                          variant='primary'
                          disabled={isSubmitting}
                          className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          icon={
                            isSubmitting ? (
                              <ClockIcon className='h-5 w-5 animate-spin' />
                            ) : (
                              <PlusIcon className='h-5 w-5' />
                            )
                          }
                        >
                          {isSubmitting ? 'Updating...' : 'Update Settings'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Settings History */}
                {allSettings.length > 0 && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <h2 className='text-xl font-semibold text-slate-900 dark:text-white mb-6'>
                        Settings History
                      </h2>

                      <div className='overflow-x-auto'>
                        <table className='w-full'>
                          <thead>
                            <tr className='border-b border-slate-200 dark:border-slate-700'>
                              <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                Date Created
                              </th>
                              <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                Interest Rate
                              </th>
                              <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                Frequency
                              </th>
                              <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                Status
                              </th>
                              <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                Created By
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allSettings.map(setting => (
                              <tr
                                key={setting.id}
                                className='border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              >
                                <td className='py-3 px-4 text-slate-900 dark:text-white'>
                                  {formatDate(setting.created_at)}
                                </td>
                                <td className='py-3 px-4 text-slate-600 dark:text-slate-400'>
                                  {formatPercentage(setting.interest_rate)}%
                                </td>
                                <td className='py-3 px-4 text-slate-600 dark:text-slate-400 capitalize'>
                                  {setting.payment_frequency}
                                </td>
                                <td className='py-3 px-4'>
                                  <Badge
                                    variant={
                                      setting.is_active ? 'primary' : 'outline'
                                    }
                                    className='text-xs'
                                  >
                                    {setting.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className='py-3 px-4 text-slate-600 dark:text-slate-400'>
                                  {setting.created_by_user.full_name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6'>
                  <Button
                    variant='ghost'
                    onClick={() => router.push('/admin/dashboard')}
                    className='text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-white'
                    icon={<ArrowLeftIcon className='h-4 w-4' />}
                  >
                    Back to Dashboard
                  </Button>

                  <div className='flex space-x-4'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/quarterly-interest')}
                      className='text-primary hover:text-purple-600 hover:bg-primary/10'
                    >
                      Interest Payments
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/settings')}
                      className='text-primary hover:text-purple-600 hover:bg-primary/10'
                    >
                      Account Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
