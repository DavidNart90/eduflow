'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
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

interface DashboardData {
  totalTeachers: number;
  totalMoMo: number;
  totalController: number;
  interestPaid: number;
  pendingReports: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    amount?: string;
    time: string;
    status: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData] = useState<DashboardData>({
    totalTeachers: 1247,
    totalMoMo: 456890,
    totalController: 789234,
    interestPaid: 23456,
    pendingReports: 3,
    recentActivities: [
      {
        id: '1',
        type: 'Controller report uploaded',
        description: 'Controller report uploaded for December 2024',
        amount: '145 records processed • 2 hours ago',
        time: '2 hours ago',
        status: 'Processed',
        icon: DocumentArrowUpIcon,
      },
      {
        id: '2',
        type: 'New teacher account created',
        description: 'New teacher account created: John Asante',
        amount: 'Teacher ID: TCH001247 • 5 hours ago',
        time: '5 hours ago',
        status: 'New',
        icon: UsersIcon,
      },
      {
        id: '3',
        type: 'Monthly report generated',
        description: 'Monthly report generated for November 2024',
        amount: 'Sent to 1,240 teachers • 1 day ago',
        time: '1 day ago',
        status: 'Completed',
        icon: DocumentTextIcon,
      },
      {
        id: '4',
        type: 'Quarterly interest payment processed',
        description: 'Quarterly interest payment processed',
        amount: '₵23,456 distributed to 1,240 accounts • 2 days ago',
        time: '2 days ago',
        status: 'Completed',
        icon: CurrencyDollarIcon,
      },
      {
        id: '5',
        type: 'System maintenance completed',
        description: 'Database backup and optimization completed',
        amount: 'Backup size: 2.3GB • 3 days ago',
        time: '3 days ago',
        status: 'Completed',
        icon: CogIcon,
      },
    ],
  });

  // Simulate loading state
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
    };

    loadData();
  }, []);

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
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Loading State */}
          {isLoading ? (
            <div className='space-y-8'>
              {/* Header Skeleton */}
              <div className='space-y-4'>
                <MuiSkeletonComponent
                  variant='rectangular'
                  width={300}
                  height={40}
                  animation='pulse'
                  className='rounded-lg'
                />
                <MuiSkeletonComponent
                  variant='rectangular'
                  width={400}
                  height={20}
                  animation='pulse'
                  className='rounded-lg'
                />
              </div>

              {/* Summary Cards Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} variant='glass' className='h-40'>
                    <CardContent>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={80}
                            height={20}
                            animation='pulse'
                            className='rounded-md'
                          />
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={40}
                            height={40}
                            animation='pulse'
                            className='rounded-full'
                          />
                        </div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={120}
                          height={32}
                          animation='pulse'
                          className='rounded-md'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={100}
                          height={16}
                          animation='pulse'
                          className='rounded-md'
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <MuiSkeletonComponent
                    key={index}
                    variant='rectangular'
                    width='100%'
                    height={64}
                    animation='pulse'
                    className='rounded-xl'
                  />
                ))}
              </div>

              {/* Quick Stats Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} variant='glass' className='h-64'>
                    <CardContent>
                      <div className='space-y-4'>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={150}
                          height={24}
                          animation='pulse'
                          className='rounded-md'
                        />
                        <div className='space-y-3'>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className='flex items-center justify-between'
                            >
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={120}
                                height={16}
                                animation='pulse'
                                className='rounded-md'
                              />
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={60}
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

              {/* Recent Activities Skeleton */}
              <Card variant='glass' className='min-h-96'>
                <CardContent>
                  <div className='space-y-6'>
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
                        height={32}
                        animation='pulse'
                        className='rounded-md'
                      />
                    </div>
                    <div className='space-y-4'>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-4 p-4 rounded-lg border border-white/20'
                        >
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={40}
                            height={40}
                            animation='pulse'
                            className='rounded-lg'
                          />
                          <div className='flex-1 space-y-2'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={200}
                              height={16}
                              animation='pulse'
                              className='rounded-md'
                            />
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={150}
                              height={14}
                              animation='pulse'
                              className='rounded-md'
                            />
                          </div>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={60}
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

              {/* Enhanced Summary Cards Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {/* Total Teachers Card */}
                <Card
                  variant='glass'
                  className='group hover:scale-105 transition-all duration-300 border-white/20 bg-white/80 dark:bg-slate-800/80'
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
                        {dashboardData.totalTeachers.toLocaleString()}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Teachers
                      </p>
                      <div className='flex items-center text-green-600 text-sm font-medium'>
                        <span className='mr-1'>↗</span>
                        <span>+12% from last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Savings (MoMo) Card */}
                <Card
                  variant='glass'
                  className='group hover:scale-105 transition-all duration-300 border-white/20 bg-white/80 dark:bg-slate-800/80'
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
                        {formatCurrency(dashboardData.totalMoMo)}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Savings (MoMo)
                      </p>
                      <div className='flex items-center text-green-600 text-sm font-medium'>
                        <span className='mr-1'>↗</span>
                        <span>+8% from last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Savings (Controller) Card */}
                <Card
                  variant='glass'
                  className='group hover:scale-105 transition-all duration-300 border-white/20 bg-white/80 dark:bg-slate-800/80'
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
                        {formatCurrency(dashboardData.totalController)}
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Total Savings (Controller)
                      </p>
                      <div className='flex items-center text-green-600 text-sm font-medium'>
                        <span className='mr-1'>↗</span>
                        <span>+15% from last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Paid Card */}
                <Card
                  variant='glass'
                  className='group hover:scale-105 transition-all duration-300 border-white/20 bg-white/80 dark:bg-slate-800/80'
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
                        {formatCurrency(dashboardData.interestPaid)}
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
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8'>
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
                >
                  <span className='hidden sm:inline'>
                    Trigger Quarterly Interest Payment
                  </span>
                  <span className='sm:hidden'>Interest Payment</span>
                </Button>
              </div>

              {/* Enhanced Quick Stats */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardHeader
                    title='Pending Actions'
                    subtitle='Items requiring attention'
                  />
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800'>
                            <DocumentArrowUpIcon className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                          </div>
                          <span className='text-sm font-medium text-slate-900 dark:text-white'>
                            Controller Reports
                          </span>
                        </div>
                        <Badge variant='warning' className='shadow-sm'>
                          {dashboardData.pendingReports} pending
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
                        <Badge variant='primary' className='shadow-sm'>
                          24 sent today
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
                        <Badge variant='success' className='shadow-sm'>
                          Healthy
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
                    {dashboardData.recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300'
                      >
                        <div className='flex items-center md:space-x-4 max-sm:space-x-1'>
                          <div className='flex-shrink-0 '>
                            <div className='p-3 rounded-xl max-sm:hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600'>
                              <activity.icon className='h-5 w-5 text-slate-600 dark:text-slate-300 ' />
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
                    ))}
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
