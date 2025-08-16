'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTeacherStore } from '@/lib/stores';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  PlusIcon,
  DocumentTextIcon,
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
          <div className='p-4 md:p-6 min-h-screen'>
            {/* Loading State */}
            <div className='space-y-8'>
              {/* Header Skeleton */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={350}
                      height={40}
                      animation='pulse'
                      className='rounded-lg mb-3'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={280}
                      height={20}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={80}
                    height={32}
                    animation='pulse'
                    className='rounded-full'
                  />
                </div>
              </div>

              {/* Summary Cards Skeleton */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card
                    key={index}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div className='space-y-2'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={150}
                              height={24}
                              animation='pulse'
                              className='rounded-md'
                            />
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={200}
                              height={16}
                              animation='pulse'
                              className='rounded-md'
                            />
                          </div>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={48}
                            height={48}
                            animation='pulse'
                            className='rounded-full'
                          />
                        </div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={160}
                          height={40}
                          animation='pulse'
                          className='rounded-md'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={120}
                          height={20}
                          animation='pulse'
                          className='rounded-md'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width='100%'
                          height={48}
                          animation='pulse'
                          className='rounded-xl'
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bottom Cards Skeleton */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card
                    key={index}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={150}
                            height={24}
                            animation='pulse'
                            className='rounded-md'
                          />
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={80}
                            height={20}
                            animation='pulse'
                            className='rounded-md'
                          />
                        </div>
                        <div className='space-y-3'>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className='flex items-center justify-between'
                            >
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={100}
                                height={16}
                                animation='pulse'
                                className='rounded-md'
                              />
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={80}
                                height={20}
                                animation='pulse'
                                className='rounded-md'
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Layout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Modern Header with Gradient Text */}
          <div className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
                <h1 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                  Hello, {dashboardData?.user?.full_name || user?.full_name}!
                </h1>
                <p className='text-slate-600 dark:text-slate-400 mt-1 md:mt-2 text-base md:text-lg'>
                  Teacher Dashboard
                </p>
                <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm'>
                  Here&apos;s your savings overview for{' '}
                  {dashboardData?.user?.management_unit ||
                    user?.management_unit}
                </p>
              </div>
              <Badge
                variant='primary'
                className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
              >
                Teacher
              </Badge>
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

          {/* Enhanced Summary Cards - Top Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Total Savings Balance Card */}
            <Card
              variant='glass'
              className=' border-white/20 bg-white/80 dark:bg-slate-800/80'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                      <BanknotesIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Total Balance
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <h3 className='text-3xl md:text-4xl font-bold text-slate-900 dark:text-white'>
                      {formatCurrency(dashboardData?.balance || 0)}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                      Your current savings with the association
                    </p>
                  </div>

                  <div className='flex items-center text-green-600 dark:text-green-400 text-sm font-medium'>
                    <ArrowTrendingUpIcon className='h-4 w-4 mr-1' />
                    <span>+5.2% from last month</span>
                  </div>

                  <Button
                    variant='primary'
                    size='lg'
                    className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl'
                    icon={<PlusIcon className='h-5 w-5' />}
                    iconPosition='left'
                    onClick={() => router.push('/teacher/add-savings')}
                  >
                    Add Savings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* This Month's Contribution Card */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
                      <ChartBarIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <h3 className='text-3xl md:text-4xl font-bold text-slate-900 dark:text-white'>
                      {formatCurrency(dashboardData?.monthlyContribution || 0)}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                      January 2024 total contributions
                    </p>
                  </div>

                  <div className='flex items-center text-green-600 dark:text-green-400 text-sm font-medium'>
                    <div className='w-2 h-2 bg-green-500 rounded-full mr-2'></div>
                    <span>
                      {dashboardData?.contributionCount || 0} contributions made
                    </span>
                  </div>

                  {/* Enhanced Contribution Breakdown */}
                  <div className='space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Controller
                      </span>
                      <span className='font-medium text-slate-900 dark:text-white'>
                        {formatCurrency(
                          dashboardData?.monthly_summary?.controller || 0
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Mobile Money
                      </span>
                      <span className='font-medium text-slate-900 dark:text-white'>
                        {formatCurrency(
                          dashboardData?.monthly_summary?.momo || 0
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Monthly Progress
                      </span>
                      <span className='text-slate-900 dark:text-white font-medium'>
                        {Math.round(
                          ((dashboardData?.monthlyContribution || 0) /
                            (dashboardData?.monthlyTarget || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500'
                        style={{
                          width: `${Math.min(((dashboardData?.monthlyContribution || 0) / (dashboardData?.monthlyTarget || 1)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      Target:{' '}
                      {formatCurrency(dashboardData?.monthlyTarget || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Bottom Row Cards */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Enhanced Savings History Card */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
                      <ClockIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                        Savings History
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Recent transactions and contributions
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => router.push('/teacher/savings-history')}
                    className='text-xs text-primary hover:text-primary/80'
                  >
                    View All
                  </Button>
                </div>

                <div className='space-y-4'>
                  {dashboardData?.recent_transactions &&
                  dashboardData.recent_transactions.length > 0 ? (
                    <div className='space-y-3'>
                      {/* Enhanced Table Header */}
                      <div className='grid grid-cols-4 gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider'>
                        <div>Date</div>
                        <div>Amount</div>
                        <div>Source</div>
                        <div>Balance</div>
                      </div>

                      {/* Enhanced Table Rows */}
                      <div className='space-y-2'>
                        {dashboardData.recent_transactions
                          .slice(0, 4)
                          .map(transaction => (
                            <div
                              key={transaction.id}
                              className='grid grid-cols-4 gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                            >
                              <div className='text-sm text-slate-900 dark:text-white font-medium'>
                                {new Date(
                                  transaction.transaction_date
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className='text-sm font-semibold text-green-600 dark:text-green-400'>
                                +{formatCurrency(transaction.amount)}
                              </div>
                              <div>
                                {getTransactionTypeBadge(
                                  transaction.transaction_type
                                )}
                              </div>
                              <div className='text-sm text-slate-900 dark:text-white font-medium'>
                                {formatCurrency(transaction.balance)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <ClockIcon className='h-8 w-8 text-slate-400' />
                      </div>
                      <p className='text-slate-500 dark:text-slate-400 font-medium'>
                        No recent transactions
                      </p>
                      <p className='text-sm text-slate-400 dark:text-slate-500 mt-1'>
                        Your transaction history will appear here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Monthly Statements Card */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg'>
                      <DocumentTextIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                        Monthly Statements
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Download your transaction reports
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-6'>
                  {/* Enhanced Month Selection */}
                  <div className='space-y-3'>
                    <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                      Select Month
                    </label>
                    <select className='w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm'>
                      <option>January 2024</option>
                      <option>December 2023</option>
                      <option>November 2023</option>
                    </select>
                  </div>

                  {/* Enhanced Download Button */}
                  <Button
                    variant='secondary'
                    size='lg'
                    className='w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg'
                    icon={<ArrowDownTrayIcon className='h-5 w-5' />}
                    iconPosition='left'
                    onClick={() => router.push('/teacher/statements')}
                  >
                    Download PDF Statement
                  </Button>

                  {/* Enhanced Recent Downloads */}
                  <div className='space-y-3'>
                    <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                      Recent Downloads
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center'>
                            <DocumentArrowDownIcon className='h-4 w-4 text-red-600 dark:text-red-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Dec 2023
                          </span>
                        </div>
                        <div className='flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400'>
                          <CalendarDaysIcon className='h-3 w-3' />
                          <span>2 days ago</span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center'>
                            <DocumentArrowDownIcon className='h-4 w-4 text-red-600 dark:text-red-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Nov 2023
                          </span>
                        </div>
                        <div className='flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400'>
                          <CalendarDaysIcon className='h-3 w-3' />
                          <span>1 week ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Footer Section */}
          <div className='mt-12 pt-8 border-t border-slate-200 dark:border-slate-700'>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-slate-500 dark:text-slate-400'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span>Secure Platform</span>
              </div>
              <div className='flex items-center space-x-2'>
                <PhoneIcon className='h-4 w-4' />
                <span>Support: +233 123 456 789</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <span>EduFlow v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
