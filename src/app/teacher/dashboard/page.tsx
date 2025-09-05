'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useTeacherData } from '@/hooks/useTeacherData';
import { useTeacherReports } from '@/hooks/useTeacherReports';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  PlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Use the optimized hook for data fetching with extended loading time
  const { dashboardData, dataSource, apiStatus, loading } = useTeacherData({
    minLoadingTime: 5000, // Wait 5 seconds for real data before showing demo
  });

  // Use the teacher reports hook
  const { reports, downloadReport } = useTeacherReports();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed:
        'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      pending:
        'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
      failed: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      momo: 'primary',
      deposit: 'primary', // Treat deposit same as momo (mobile money)
      controller: 'secondary',
      interest: 'success',
    } as const;

    const icons = {
      momo: <PhoneIcon className='h-3 w-3' />,
      deposit: <PhoneIcon className='h-3 w-3' />, // Use phone icon for deposit too
      controller: <UserIcon className='h-3 w-3' />,
      interest: <ChartBarIcon className='h-3 w-3' />,
    };

    const getDisplayText = (transactionType: string) => {
      switch (transactionType) {
        case 'momo':
        case 'deposit':
          return 'Mobile Money';
        case 'controller':
          return 'Controller';
        case 'interest':
          return '% Interest';
        default:
          return 'Unknown';
      }
    };

    return (
      <Badge
        variant={variants[type as keyof typeof variants] || 'default'}
        icon={icons[type as keyof typeof icons]}
        iconPosition='left'
      >
        {getDisplayText(type)}
      </Badge>
    );
  };

  // Simplified loading condition
  if (loading || apiStatus === 'loading') {
    return (
      <TeacherRoute>
        <Layout>
          <div className='p-4 md:p-6 min-h-screen'>
            {/* Loading State */}
            <div className='space-y-8'>
              {/* Enhanced Loading Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div>
                    <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 w-80 animate-pulse'></div>
                    <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-60 animate-pulse'></div>
                  </div>
                  <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse'></div>
                </div>

                {/* Loading Progress Indicator */}
                <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-6 h-6 bg-blue-500 rounded-full animate-spin flex items-center justify-center'>
                      <div className='w-2 h-2 bg-white rounded-full'></div>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                        Loading your data...
                      </h4>
                      <p className='text-sm text-blue-700 dark:text-blue-300'>
                        Please wait while we fetch your latest information from
                        the server.
                      </p>
                    </div>
                  </div>

                  {/* Progress bar animation */}
                  <div className='mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full animate-pulse'
                      style={{
                        width: '60%',
                        animation: 'loading-progress 3s ease-in-out infinite',
                      }}
                    ></div>
                  </div>
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
                            <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-36 animate-pulse'></div>
                            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-48 animate-pulse'></div>
                          </div>
                          <div className='h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse'></div>
                        </div>
                        <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-40 animate-pulse'></div>
                        <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-30 animate-pulse'></div>
                        <div className='h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse'></div>
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
                          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-36 animate-pulse'></div>
                          <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse'></div>
                        </div>
                        <div className='space-y-3'>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className='flex items-center justify-between'
                            >
                              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse'></div>
                              <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse'></div>
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
                  Here{'\u2019'}s your savings overview for{' '}
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
                        Your account is connected but you haven{'\u2019'}t made
                        any contributions yet. Start saving today!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Summary Cards - Top Row */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Total Savings Balance Card */}
            <Card
              variant='glass'
              className=' border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl'
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

                  <div
                    className={`flex items-center text-sm font-medium ${
                      (dashboardData?.trend_percentage || 0) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {(dashboardData?.trend_percentage || 0) >= 0 ? (
                      <ArrowTrendingUpIcon className='h-4 w-4 mr-1' />
                    ) : (
                      <ArrowTrendingDownIcon className='h-4 w-4 mr-1' />
                    )}
                    <span>
                      {dashboardData?.trend_percentage !== undefined
                        ? `${dashboardData.trend_percentage >= 0 ? '+' : ''}${dashboardData.trend_percentage.toFixed(1)}% from last month`
                        : 'No trend data'}
                    </span>
                  </div>

                  {/* Total Contributions Breakdown */}
                  <div className='space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700'>
                    <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                      Total Contributions
                    </h4>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                      <div className='flex justify-between items-center sm:col-span-'>
                        <span className='text-green-600 dark:text-green-400 text-sm font-medium'>
                          {dashboardData?.total_contributions?.count || 0}{' '}
                          contributions
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-slate-600 dark:text-slate-400'>
                          Controller
                        </span>
                        <span className='font-medium text-slate-900 dark:text-white'>
                          {formatCurrency(
                            dashboardData?.total_contributions?.controller || 0
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-slate-600 dark:text-slate-400'>
                          Mobile Money
                        </span>
                        <span className='font-medium text-slate-900 dark:text-white'>
                          {formatCurrency(
                            dashboardData?.total_contributions?.momo || 0
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center sm:col-span-2'>
                        <span className='text-slate-600 dark:text-slate-400'>
                          Interest Earned
                        </span>
                        <span className='font-medium text-orange-600 dark:text-orange-400'>
                          {formatCurrency(
                            dashboardData?.total_contributions?.interest || 0
                          )}
                        </span>
                      </div>
                    </div>
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

            {/* This Month{'\u2019'}s Contribution Card */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl'
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
                      {formatCurrency(
                        dashboardData?.monthly_summary?.total || 0
                      )}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                      {dashboardData?.current_month_year?.month || 'Current'}{' '}
                      {dashboardData?.current_month_year?.year ||
                        new Date().getFullYear()}{' '}
                      total contributions
                    </p>
                  </div>

                  <div className='flex items-center text-green-600 dark:text-green-400 text-sm font-medium'>
                    <div className='w-2 h-2 bg-green-500 rounded-full mr-2'></div>
                    <span>
                      {dashboardData?.monthly_summary?.contributionCount || 0}{' '}
                      contributions made
                    </span>
                  </div>

                  {/* Remove the Monthly Progress section and replace with more contribution stats */}
                  <div className='space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700'>
                    <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                      This Month Breakdown
                    </h4>
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
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Interest
                      </span>
                      <span className='font-medium text-orange-600 dark:text-orange-400'>
                        {formatCurrency(
                          dashboardData?.monthly_summary?.interest || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interest Earned Card */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl'
            >
              <CardContent className='p-2 md:p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg'>
                      <ArrowTrendingUpIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Interest Earned
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <h3 className='text-3xl md:text-4xl font-bold text-slate-900 dark:text-white'>
                      {formatCurrency(
                        dashboardData?.total_contributions?.interest || 0
                      )}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                      Total interest from quarterly payments
                    </p>
                  </div>

                  <div className='flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium'>
                    <div className='w-2 h-2 bg-orange-500 rounded-full mr-2'></div>
                    <span>
                      {(dashboardData?.monthly_summary?.interest || 0) > 0
                        ? `+${formatCurrency(
                            dashboardData?.monthly_summary?.interest || 0
                          )} this quarter`
                        : 'No interest this Quarter'}
                    </span>
                  </div>

                  {/* Interest Details */}
                  <div className='space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700'>
                    <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                      Interest Information
                    </h4>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Current Rate
                      </span>
                      <span className='font-medium text-slate-900 dark:text-white'>
                        {formatPercentage(
                          dashboardData?.interest_setting?.interest_rate ||
                            0.0425
                        )}
                        %{' '}
                        {dashboardData?.interest_setting?.payment_frequency ||
                          'quarterly'}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-slate-600 dark:text-slate-400'>
                        Next Payment
                      </span>
                      <span className='font-medium text-slate-900 dark:text-white'>
                        End of Q{Math.ceil((new Date().getMonth() + 1) / 3)}
                      </span>
                    </div>
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
                      {/* Enhanced Table Header - Hidden on mobile, use card layout instead */}
                      <div className='hidden md:grid grid-cols-4 gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider'>
                        <div>Date</div>
                        <div>Amount</div>
                        <div>Source</div>
                        <div>Status</div>
                      </div>

                      {/* Enhanced Table Rows - Responsive layout */}
                      <div className='space-y-2'>
                        {dashboardData.recent_transactions
                          .slice(0, 5)
                          .map(transaction => (
                            <div
                              key={transaction.id}
                              className='px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                            >
                              {/* Desktop Layout */}
                              <div className='hidden md:grid grid-cols-4 gap-4'>
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
                                <div>{getStatusBadge(transaction.status)}</div>
                              </div>

                              {/* Mobile Layout */}
                              <div className='md:hidden space-y-2'>
                                <div className='flex justify-between items-start'>
                                  <div>
                                    <div className='text-sm font-medium text-slate-900 dark:text-white'>
                                      {new Date(
                                        transaction.transaction_date
                                      ).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </div>
                                    <div className='text-lg font-semibold text-green-600 dark:text-green-400'>
                                      +{formatCurrency(transaction.amount)}
                                    </div>
                                  </div>
                                  <div className='text-right space-y-1'>
                                    {getTransactionTypeBadge(
                                      transaction.transaction_type
                                    )}
                                    <div>
                                      {getStatusBadge(transaction.status)}
                                    </div>
                                  </div>
                                </div>
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
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => router.push('/teacher/statements')}
                    className='text-xs text-primary hover:text-primary/80'
                  >
                    View All
                  </Button>
                </div>

                <div className='space-y-6'>
                  {/* Quick Download Section */}
                  {reports && reports.length > 0 ? (
                    <div className='space-y-3'>
                      <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        Recent Reports ({reports.length} available)
                      </h4>
                      <div className='space-y-2 max-h-60 overflow-y-auto'>
                        {reports.slice(0, 5).map(report => (
                          <div
                            key={report.id}
                            className='flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center'>
                                <DocumentArrowDownIcon className='h-4 w-4 text-red-600 dark:text-red-400' />
                              </div>
                              <div>
                                <span className='text-sm font-medium text-slate-900 dark:text-white block'>
                                  {report.file_name}
                                </span>
                                <span className='text-xs text-slate-500 dark:text-slate-400'>
                                  {new Date(
                                    report.created_at
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}{' '}
                                  • Downloaded {report.download_count} times
                                </span>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                downloadReport(report.id, report.file_name)
                              }
                              className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                            >
                              <ArrowDownTrayIcon className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <DocumentTextIcon className='h-8 w-8 text-slate-400' />
                      </div>
                      <p className='text-slate-500 dark:text-slate-400 font-medium'>
                        No reports available
                      </p>
                      <p className='text-sm text-slate-400 dark:text-slate-500 mt-1'>
                        Reports will appear here when generated by admin
                      </p>
                    </div>
                  )}

                  {/* Enhanced Download Button */}
                  <Button
                    variant='secondary'
                    size='lg'
                    className='w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg'
                    icon={<ArrowDownTrayIcon className='h-5 w-5' />}
                    iconPosition='left'
                    onClick={() => router.push('/teacher/statements')}
                  >
                    View All Statements
                  </Button>
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
