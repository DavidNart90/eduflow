'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTeacherStore } from '@/lib/stores';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  DashboardSkeleton,
} from '@/components/ui';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  user: {
    id: string;
    full_name: string;
    employee_id: string;
    management_unit: string;
    email: string;
    phone_number?: string;
  };
  balance: number;
  monthlyContribution: number;
  monthlyTarget: number;
  contributionCount: number;
  recent_transactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    transaction_type: 'momo' | 'controller' | 'interest';
    transaction_date: Date;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    balance: number;
  }>;
  monthly_summary: {
    total: number;
    momo: number;
    controller: number;
    interest: number;
  };
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { loading, setBalance, setTransactions, setLoading, setError } =
    useTeacherStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [dataSource, setDataSource] = useState<'api' | 'mock' | 'empty'>('api');
  const [apiStatus, setApiStatus] = useState<
    'loading' | 'success' | 'error' | 'idle'
  >('idle');
  const hasFetchedData = useRef(false);

  // Check if user is actually a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      if (user.role === 'admin') {
        // Use router.push instead of window.location for better navigation
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      // Prevent multiple fetches
      if (hasFetchedData.current) {
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout for mobile

      try {
        setLoading(true);
        setError(null);
        setApiStatus('loading');
        hasFetchedData.current = true;

        // Get the session token
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return; // Check if component is still mounted

        if (!currentSession?.access_token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch('/api/teacher/dashboard', {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal, // Add abort signal
        });

        clearTimeout(timeoutId); // Clear timeout if request succeeds

        if (!isMounted) return; // Check if component is still mounted

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch dashboard data');
        }

        if (!isMounted) return; // Check if component is still mounted

        // Successfully fetched data from API
        setDashboardData(data);
        setBalance(data.balance || 0); // Handle null/undefined balance
        setTransactions(data.recent_transactions || []); // Handle null/undefined transactions
        setApiStatus('success');

        // Determine data source based on actual content
        if (
          data.balance === 0 &&
          (!data.recent_transactions || data.recent_transactions.length === 0)
        ) {
          setDataSource('empty'); // API worked but user has no data
        } else {
          setDataSource('api'); // API worked and has real data
        }

        // Clear any previous errors since API call succeeded
        setError(null);
      } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error

        if (!isMounted) return; // Check if component is still mounted

        // Handle aborted requests (user navigated away or timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't show error to user
          return;
        }

        // Log error for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Dashboard API Error:', error);
        }

        setApiStatus('error');
        setDataSource('mock'); // Using mock data due to API failure
        setError(
          error instanceof Error ? error.message : 'Failed to load dashboard'
        );

        // Only set mock data if API completely fails (not if data is just empty)
        // This distinguishes between API failure vs empty legitimate data
        const defaultData: DashboardData = {
          user: {
            id: user?.id || '',
            full_name: user?.full_name || 'Miss Vida Opokuah (Demo)',
            employee_id: user?.employee_id || 'EMP001',
            management_unit: user?.management_unit || 'Demo Unit',
            email: user?.email || '',
            phone_number: user?.phone_number,
          },
          balance: 12450.75,
          monthlyContribution: 1250.5,
          monthlyTarget: 1500,
          contributionCount: 3,
          recent_transactions: [
            {
              id: '1',
              user_id: user?.id || '',
              amount: 500.0,
              transaction_type: 'momo',
              transaction_date: new Date('2024-01-15'),
              description: 'Mobile Money Payment',
              status: 'completed',
              balance: 12450.75,
            },
            {
              id: '2',
              user_id: user?.id || '',
              amount: 750.5,
              transaction_type: 'controller',
              transaction_date: new Date('2024-01-01'),
              description: 'Controller Deduction',
              status: 'completed',
              balance: 11950.75,
            },
            {
              id: '3',
              user_id: user?.id || '',
              amount: 125.25,
              transaction_type: 'interest',
              transaction_date: new Date('2023-12-28'),
              description: 'Interest Payment',
              status: 'completed',
              balance: 11200.25,
            },
            {
              id: '4',
              user_id: user?.id || '',
              amount: 600.0,
              transaction_type: 'momo',
              transaction_date: new Date('2023-12-15'),
              description: 'Mobile Money Payment',
              status: 'completed',
              balance: 11075.0,
            },
          ],
          monthly_summary: {
            total: 1250.5,
            momo: 500.0,
            controller: 750.5,
            interest: 0,
          },
        };
        setDashboardData(defaultData);
        setBalance(12450.75);
        setTransactions(defaultData.recent_transactions);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user && !hasFetchedData.current) {
      fetchDashboardData();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      // Reset the flag if component unmounts during fetch
      if (hasFetchedData.current) {
        hasFetchedData.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Store setters are stable and don't need to be in deps

  // Early return if user is not a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600 dark:text-gray-400'>
            Redirecting to appropriate dashboard...
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      momo: 'primary',
      controller: 'secondary',
      interest: 'success',
    } as const;

    const icons = {
      momo: <PhoneIcon className='h-3 w-3' />,
      controller: <UserIcon className='h-3 w-3' />,
      interest: <ChartBarIcon className='h-3 w-3' />,
    };

    return (
      <Badge
        variant={variants[type as keyof typeof variants] || 'default'}
        icon={icons[type as keyof typeof icons]}
        iconPosition='left'
      >
        {type === 'momo'
          ? 'MoMo'
          : type === 'controller'
            ? 'Controller'
            : '% Interest'}
      </Badge>
    );
  };

  if (loading || apiStatus === 'loading') {
    return (
      <TeacherRoute>
        <Layout>
          <div className='p-6'>
            <div className='mb-4 text-center'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {apiStatus === 'loading'
                  ? 'Loading your savings data...'
                  : 'Initializing...'}
              </p>
            </div>
            <DashboardSkeleton />
          </div>
        </Layout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <Layout>
        <div className='p-6'>
          {/* Welcome Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Hello, {dashboardData?.user?.full_name || user?.full_name}!
                </h1>
                <p className='text-gray-600 dark:text-gray-400 mt-2'>
                  Here&apos;s your savings overview for{' '}
                  {dashboardData?.user?.management_unit ||
                    user?.management_unit}
                </p>
              </div>
            </div>
          </div>

          {/* Data Status Indicator */}
          {(dataSource === 'mock' || dataSource === 'empty') && (
            <div className='mb-6'>
              {dataSource === 'mock' ? (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
                  <div className='flex items-center'>
                    <div className='w-8 h-8 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center mr-3'>
                      <svg
                        className='w-4 h-4 text-yellow-600 dark:text-yellow-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                        Demo Data Active
                      </h4>
                      <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                        Unable to connect to server. Showing sample data for
                        demonstration purposes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                  <div className='flex items-center'>
                    <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-3'>
                      <svg
                        className='w-4 h-4 text-blue-600 dark:text-blue-400'
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
                    <div>
                      <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                        No Transaction History
                      </h4>
                      <p className='text-sm text-blue-700 dark:text-blue-300'>
                        Your account is connected but you haven&apos;t made any
                        contributions yet. Start saving today!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Dashboard Cards - Top Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Total Savings Balance Card */}
            <Card variant='glass' className='relative overflow-hidden'>
              <div className='absolute top-4 right-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                <CurrencyDollarIcon className='h-6 w-6 text-primary' />
              </div>
              <CardContent className='p-6'>
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    Total Savings Balance
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 text-sm'>
                    Your current savings with the association
                  </p>
                </div>

                <div className='mb-6'>
                  <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                    {formatCurrency(dashboardData?.balance || 0)}
                  </div>
                  <div className='flex items-center text-green-600 dark:text-green-400 text-sm'>
                    <ArrowTrendingUpIcon className='h-4 w-4 mr-1' />
                    +5.2% from last month
                  </div>
                </div>

                <Button
                  variant='primary'
                  size='lg'
                  className='w-full'
                  icon={<PhoneIcon className='h-5 w-5' />}
                  iconPosition='left'
                  onClick={() => router.push('/teacher/add-savings')}
                >
                  Add Savings via Momo
                </Button>
              </CardContent>
            </Card>

            {/* This Month's Contribution Card */}
            <Card variant='glass' className='relative overflow-hidden'>
              <div className='absolute top-4 right-4 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <ChartBarIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <CardContent className='p-6'>
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    This Month&apos;s Contribution
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 text-sm'>
                    January 2024 total contributions
                  </p>
                </div>

                <div className='mb-6'>
                  <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                    {formatCurrency(dashboardData?.monthlyContribution || 0)}
                  </div>
                  <div className='flex items-center text-green-600 dark:text-green-400 text-sm mb-4'>
                    <div className='w-4 h-4 bg-green-500 rounded-full mr-2'></div>
                    {dashboardData?.contributionCount || 0} contributions made
                  </div>
                </div>

                {/* Contribution Breakdown */}
                <div className='space-y-3 mb-6'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600 dark:text-gray-400 text-sm'>
                      Controller Deduction
                    </span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {formatCurrency(
                        dashboardData?.monthly_summary?.controller || 0
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600 dark:text-gray-400 text-sm'>
                      Mobile Money
                    </span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {formatCurrency(
                        dashboardData?.monthly_summary?.momo || 0
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='mb-4'>
                  <div className='flex justify-between text-sm mb-2'>
                    <span className='text-gray-600 dark:text-gray-400'>
                      Progress
                    </span>
                    <span className='text-gray-900 dark:text-white font-medium'>
                      {Math.round(
                        ((dashboardData?.monthlyContribution || 0) /
                          (dashboardData?.monthlyTarget || 1)) *
                          100
                      )}
                      % of monthly target
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.min(((dashboardData?.monthlyContribution || 0) / (dashboardData?.monthlyTarget || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Target: {formatCurrency(dashboardData?.monthlyTarget || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Cards - Bottom Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Savings History Card */}
            <Card variant='glass'>
              <CardHeader
                title='Savings History'
                subtitle='Recent transactions and contributions'
              />
              <CardContent>
                <div className='space-y-4'>
                  {dashboardData?.recent_transactions &&
                  dashboardData.recent_transactions.length > 0 ? (
                    <div className='overflow-hidden'>
                      {/* Table Header */}
                      <div className='grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                        <div>DATE</div>
                        <div>AMOUNT</div>
                        <div>SOURCE</div>
                        <div>BALANCE</div>
                      </div>

                      {/* Table Rows */}
                      <div className='space-y-2'>
                        {dashboardData.recent_transactions.map(transaction => (
                          <div
                            key={transaction.id}
                            className='grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors'
                          >
                            <div className='text-sm text-gray-900 dark:text-white'>
                              {new Date(
                                transaction.transaction_date
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div className='text-sm font-medium text-green-600 dark:text-green-400'>
                              +{formatCurrency(transaction.amount)}
                            </div>
                            <div>
                              {getTransactionTypeBadge(
                                transaction.transaction_type
                              )}
                            </div>
                            <div className='text-sm text-gray-900 dark:text-white'>
                              {formatCurrency(transaction.balance)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <ClockIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500 dark:text-gray-400'>
                        No recent transactions
                      </p>
                      <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>
                        Your transaction history will appear here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Statements Card */}
            <Card variant='glass'>
              <CardHeader
                title='Monthly Statements'
                subtitle='Download your transaction reports'
              />
              <CardContent>
                <div className='space-y-6'>
                  {/* Month Selection */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Select Month
                    </label>
                    <select className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent'>
                      <option>January 2024</option>
                      <option>December 2023</option>
                      <option>November 2023</option>
                    </select>
                  </div>

                  {/* Download Button */}
                  <Button
                    variant='primary'
                    size='lg'
                    className='w-full'
                    icon={<ArrowDownTrayIcon className='h-5 w-5' />}
                    iconPosition='left'
                  >
                    Download PDF Statement
                  </Button>

                  {/* Recent Downloads */}
                  <div className='space-y-3'>
                    <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Recent Downloads
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <DocumentArrowDownIcon className='h-5 w-5 text-red-500' />
                          <span className='text-sm text-gray-900 dark:text-white'>
                            Dec 2023
                          </span>
                        </div>
                        <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400'>
                          <span>Downloaded 2 days ago</span>
                          <ArrowDownTrayIcon className='h-4 w-4' />
                        </div>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <DocumentArrowDownIcon className='h-5 w-5 text-red-500' />
                          <span className='text-sm text-gray-900 dark:text-white'>
                            Nov 2023
                          </span>
                        </div>
                        <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400'>
                          <span>Downloaded 1 week ago</span>
                          <ArrowDownTrayIcon className='h-4 w-4' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Links */}
          <div className='mt-12 pt-8 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400'>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 bg-green-500 rounded-full'></div>
                <span>Secure Platform</span>
              </div>
              <div className='flex items-center space-x-2'>
                <PhoneIcon className='h-4 w-4' />
                <span>Support: +233 123 456 789</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
