'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BanknotesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { dashboardData, isLoading, error, dataSource, refetch } =
    useAdminData();

  // Check if user is actually an admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      if (user.role === 'teacher') {
        window.location.href = '/teacher/dashboard';
      }
    }
  }, [user]);

  // Early return if user is not an admin
  if (user && user.role !== 'admin') {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Success: 'success',
      Processed: 'primary',
      New: 'secondary',
      Completed: 'success',
      Pending: 'warning',
      Failed: 'error',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      DocumentArrowUpIcon,
      UsersIcon,
      DocumentTextIcon,
      CurrencyDollarIcon,
      CogIcon,
    };
    return icons[iconName as keyof typeof icons] || DocumentTextIcon;
  };

  const formatTrend = (percentage: number) => {
    if (percentage === 0)
      return {
        text: '0% from last month',
        color: 'text-slate-600 dark:text-slate-400',
        arrow: '',
      };

    const isPositive = percentage > 0;

    return {
      text: `${isPositive ? '+' : ''}${percentage}% from last month`,
      color: isPositive
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400',
      arrow: isPositive ? '↗' : '↘',
    };
  };

  // Only show error state for critical errors (not session/loading issues)
  // and only if we're not in a loading state
  if (error && !isLoading && error.includes('Access denied')) {
    return (
      <AdminRoute>
        <Layout>
          <div className='p-4 md:p-6 min-h-screen'>
            <div className='text-center py-12'>
              <div className='text-red-500 mb-4'>
                <svg
                  className='w-12 h-12 mx-auto'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                Access Denied
              </h3>
              <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </div>
        </Layout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Loading State - Show when loading OR when we don't have data yet */}
          {isLoading || !dashboardData ? (
            <div className='space-y-8'>
              {/* Header Skeleton */}
              <div className='space-y-4'>
                <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-80 animate-pulse'></div>
                <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 animate-pulse'></div>
              </div>

              {/* Summary Cards Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className='bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 p-6 space-y-4'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse'></div>
                      <div className='h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse'></div>
                    </div>
                    <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse'></div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className='h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse'
                  ></div>
                ))}
              </div>

              {/* Quick Stats Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className='bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 p-6 space-y-4 h-64'
                  >
                    <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse'></div>
                    <div className='space-y-3'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className='flex items-center justify-between'
                        >
                          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse'></div>
                          <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse'></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activities Skeleton */}
              <div className='bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 p-6 space-y-6 min-h-96'>
                <div className='flex items-center justify-between'>
                  <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse'></div>
                  <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse'></div>
                </div>
                <div className='space-y-4'>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className='flex items-center space-x-4 p-4 rounded-lg border border-white/20'
                    >
                      <div className='h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'></div>
                      <div className='flex-1 space-y-2'>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse'></div>
                        <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse'></div>
                      </div>
                      <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse'></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Overview Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div>
                    <h1 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                      Admin Dashboard
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-1 md:mt-2 text-base md:text-lg'>
                      Dashboard Overview
                    </p>
                    <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm'>
                      Monitor system statistics and manage operations
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

              {/* Data Status Indicator */}
              {dataSource === 'mock' && (
                <div className='mb-6'>
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
                </div>
              )}

              {/* Enhanced Summary Cards Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {/* Total Teachers Card */}
                <Card
                  variant='glass'
                  className='hover:shadow-xl border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                          <UserGroupIcon className='h-6 w-6' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            Total
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-3xl font-bold text-slate-900 dark:text-white'>
                        {dashboardData.systemStats?.total_teachers?.toLocaleString() ||
                          0}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Teachers
                      </p>
                      {(() => {
                        const trend = formatTrend(
                          dashboardData.trends?.teachers || 0
                        );
                        return (
                          <div
                            className={`flex items-center text-sm font-medium ${trend.color}`}
                          >
                            <span className='mr-1'>{trend.arrow}</span>
                            <span>{trend.text}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Savings (MoMo) Card */}
                <Card
                  variant='glass'
                  className='hover:shadow-xl border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
                          <BanknotesIcon className='h-6 w-6' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            MoMo
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-3xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(dashboardData.totalMoMo || 0)}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Savings (MoMo)
                      </p>
                      {(() => {
                        const trend = formatTrend(
                          dashboardData.trends?.momoContributions || 0
                        );
                        return (
                          <div
                            className={`flex items-center text-sm font-medium ${trend.color}`}
                          >
                            <span className='mr-1'>{trend.arrow}</span>
                            <span>{trend.text}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Savings (Controller) Card */}
                <Card
                  variant='glass'
                  className='hover:shadow-xl border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
                          <DocumentTextIcon className='h-6 w-6' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            Controller
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-3xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(dashboardData.totalController || 0)}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Savings (Controller)
                      </p>
                      {(() => {
                        const trend = formatTrend(
                          dashboardData.trends?.controllerContributions || 0
                        );
                        return (
                          <div
                            className={`flex items-center text-sm font-medium ${trend.color}`}
                          >
                            <span className='mr-1'>{trend.arrow}</span>
                            <span>{trend.text}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Paid Card */}
                <Card
                  variant='glass'
                  className='hover:shadow-xl border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg'>
                          <CalendarDaysIcon className='h-6 w-6' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            Q4 2024
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-3xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(dashboardData.interestPaid || 0)}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Interest Paid This Quarter
                      </p>
                      <div className='flex items-center text-slate-600 dark:text-slate-400 text-sm'>
                        <CalendarDaysIcon className='h-4 w-4 mr-1' />
                        <span>Next payment: Mar 2025</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Action Buttons */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
                <Button
                  variant='primary'
                  size='sm'
                  className='w-full h-12 md:h-16 text-sm md:text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl'
                  icon={
                    <DocumentArrowUpIcon className='h-5 w-5 md:h-6 md:w-6' />
                  }
                  onClick={() => router.push('/admin/upload-controller-report')}
                >
                  <span className='hidden sm:inline'>
                    Upload Controller Report
                  </span>
                  <span className='sm:hidden'>Upload Report</span>
                </Button>

                <Button
                  variant='secondary'
                  size='sm'
                  className='w-full h-12 md:h-16 text-sm md:text-lg shadow-xl'
                  icon={<DocumentTextIcon className='h-5 w-5 md:h-6 md:w-6' />}
                  onClick={() =>
                    router.push('/admin/generate-quarterly-reports')
                  }
                >
                  <span className='hidden sm:inline'>
                    Generate Monthly Reports
                  </span>
                  <span className='sm:hidden'>Generate Reports</span>
                </Button>

                <Button
                  variant='success'
                  size='sm'
                  className='w-full h-12 md:h-16 text-sm md:text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-xl'
                  icon={
                    <CurrencyDollarIcon className='h-5 w-5 md:h-6 md:w-6' />
                  }
                  onClick={() => router.push('/admin/quarterly-interest')}
                >
                  <span className='hidden sm:inline'>
                    Trigger Quarterly Interest Payment
                  </span>
                  <span className='sm:hidden'>Interest Payment</span>
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  className='w-full h-12 md:h-16 text-sm md:text-lg shadow-xl border-purple-200 text-purple-700 hover:bg-purple-600 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20'
                  icon={<ChartBarIcon className='h-5 w-5 md:h-6 md:w-6' />}
                  onClick={() => router.push('/admin/savings-history')}
                >
                  <span className='hidden sm:inline'>
                    Savings & Transactions
                  </span>
                  <span className='sm:hidden'>Transactions</span>
                </Button>
              </div>

              {/* Total System Savings - Prominent Display */}
              <div className='mb-8'>
                <Card
                  variant='glass'
                  className='bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/50'
                >
                  <CardContent className='p-8'>
                    <div className='text-center'>
                      <div className='flex items-center justify-center mb-4'>
                        <div className='p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'>
                          <svg
                            className='h-10 w-10'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                            />
                          </svg>
                        </div>
                      </div>
                      <h2 className='text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                        Total System Savings
                      </h2>
                      <div className='text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent mb-4'>
                        {formatCurrency(
                          (dashboardData.systemStats?.total_savings || 0) -
                            (dashboardData.interestPaid || 0)
                        )}
                      </div>
                      <p className='text-slate-600 dark:text-slate-400 text-sm md:text-base mb-6'>
                        Net savings amount in the system (Total contributions -
                        Interest paid)
                      </p>

                      {/* Breakdown */}
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                        <div className='bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 border border-white/30 dark:border-slate-600/30'>
                          <div className='font-semibold text-slate-900 dark:text-white'>
                            {formatCurrency(
                              dashboardData.systemStats?.total_savings || 0
                            )}
                          </div>
                          <div className='text-slate-600 dark:text-slate-400 text-xs'>
                            Total Contributions
                          </div>
                        </div>
                        <div className='bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 border border-white/30 dark:border-slate-600/30'>
                          <div className='font-semibold text-slate-900 dark:text-white'>
                            -{formatCurrency(dashboardData.interestPaid || 0)}
                          </div>
                          <div className='text-slate-600 dark:text-slate-400 text-xs'>
                            Interest Paid
                          </div>
                        </div>
                        <div className='bg-emerald-100/80 dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-200/50 dark:border-emerald-700/50'>
                          <div className='font-bold text-emerald-800 dark:text-emerald-300'>
                            {formatCurrency(
                              (dashboardData.systemStats?.total_savings || 0) -
                                (dashboardData.interestPaid || 0)
                            )}
                          </div>
                          <div className='text-emerald-700 dark:text-emerald-400 text-xs font-medium'>
                            Net Savings
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Quick Stats */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardHeader
                    title='System Activity'
                    subtitle='Monthly reports and notifications'
                  />
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-2 rounded-lg bg-purple-100 dark:bg-purple-800'>
                            <DocumentArrowUpIcon className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Controller Reports
                          </span>
                        </div>
                        <Badge variant='primary' className='shadow-sm'>
                          {dashboardData.systemStats
                            ?.controller_reports_uploaded || 0}{' '}
                          this month
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-800'>
                            <EnvelopeIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Email Notifications
                          </span>
                        </div>
                        <Badge variant='success' className='shadow-sm'>
                          {dashboardData.systemStats?.emails_sent || 0} sent
                          this month
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardHeader
                    title='System Health'
                    subtitle='Current system status'
                  />
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-2 rounded-lg bg-green-100 dark:bg-green-800'>
                            <ChartBarIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Database
                          </span>
                        </div>
                        <Badge
                          variant={
                            dashboardData.systemStats?.system_health === 'good'
                              ? 'success'
                              : dashboardData.systemStats?.system_health ===
                                  'warning'
                                ? 'warning'
                                : 'error'
                          }
                          className='shadow-sm'
                        >
                          {dashboardData.systemStats?.system_health === 'good'
                            ? 'Healthy'
                            : dashboardData.systemStats?.system_health ===
                                'warning'
                              ? 'Warning'
                              : 'Error'}
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-2 rounded-lg bg-green-100 dark:bg-green-800'>
                            <CogIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            API Services
                          </span>
                        </div>
                        <Badge variant='success' className='shadow-sm'>
                          Online
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/*Recent Activities */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardHeader
                  title='Recent Activities'
                  subtitle='Latest system activities and operations'
                  action={
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  <div className='space-y-4'>
                    {dashboardData.recentActivities &&
                    dashboardData.recentActivities.length > 0 ? (
                      dashboardData.recentActivities.map(activity => {
                        const IconComponent = getIconComponent(activity.icon);
                        return (
                          <div
                            key={activity.id}
                            className='flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300'
                          >
                            <div className='flex items-center md:space-x-4 max-sm:space-x-1'>
                              <div className='flex-shrink-0 '>
                                <div className='p-3 rounded-xl max-sm:hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600'>
                                  <IconComponent className='h-5 w-5 text-slate-600 dark:text-slate-300' />
                                </div>
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm font-medium text-slate-900 dark:text-white'>
                                  {activity.description}
                                </p>
                                <p className='text-sm text-slate-500 dark:text-slate-400'>
                                  {activity.amount}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              {getStatusBadge(activity.status)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className='text-center py-8'>
                        <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <ChartBarIcon className='h-8 w-8 text-slate-400' />
                        </div>
                        <p className='text-slate-500 dark:text-slate-400 font-medium'>
                          No recent activities
                        </p>
                        <p className='text-sm text-slate-400 dark:text-slate-500 mt-1'>
                          System activities will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
}
