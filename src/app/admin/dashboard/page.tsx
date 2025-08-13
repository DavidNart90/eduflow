'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  SummaryCard,
  Button,
  Badge,
} from '@/components/ui';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CogIcon,
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
        <div className='p-6'>
          {/* Welcome Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
              Admin Dashboard
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>
              Monitor system statistics and manage operations
            </p>
          </div>

          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <SummaryCard
              title='Total Teachers'
              value={dashboardData.totalTeachers.toLocaleString()}
              description='+12% from last month'
              icon={<UsersIcon className='h-6 w-6' />}
              variant='primary'
              trend={{ value: '+12%', isPositive: true }}
            />

            <SummaryCard
              title='Total Savings (MoMo)'
              value={formatCurrency(dashboardData.totalMoMo)}
              description='+8% from last month'
              icon={<CurrencyDollarIcon className='h-6 w-6' />}
              variant='success'
              trend={{ value: '+8%', isPositive: true }}
            />

            <SummaryCard
              title='Total Savings (Controller)'
              value={formatCurrency(dashboardData.totalController)}
              description='+15% from last month'
              icon={<DocumentTextIcon className='h-6 w-6' />}
              variant='primary'
              trend={{ value: '+15%', isPositive: true }}
            />

            <SummaryCard
              title='Interest Paid This Quarter'
              value={formatCurrency(dashboardData.interestPaid)}
              description='Next payment: Mar 2025'
              icon={<CurrencyDollarIcon className='h-6 w-6' />}
              variant='warning'
            />
          </div>

          {/* Action Buttons - Admin Specific */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Button
              variant='primary'
              size='lg'
              className='w-full h-16 text-lg'
              icon={<DocumentArrowUpIcon className='h-6 w-6' />}
            >
              Upload Controller Report
            </Button>

            <Button
              variant='secondary'
              size='lg'
              className='w-full h-16 text-lg'
              icon={<DocumentTextIcon className='h-6 w-6' />}
            >
              Generate Monthly Reports
            </Button>

            <Button
              variant='success'
              size='lg'
              className='w-full h-16 text-lg'
              icon={<CurrencyDollarIcon className='h-6 w-6' />}
            >
              Trigger Quarterly Interest Payment
            </Button>
          </div>

          {/* Quick Stats - Admin Specific */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <Card>
              <CardHeader
                title='Pending Actions'
                subtitle='Items requiring attention'
              />
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <DocumentArrowUpIcon className='h-5 w-5 text-yellow-600' />
                      <span className='text-sm font-medium'>
                        Controller Reports
                      </span>
                    </div>
                    <Badge variant='warning'>
                      {dashboardData.pendingReports} pending
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <EnvelopeIcon className='h-5 w-5 text-blue-600' />
                      <span className='text-sm font-medium'>
                        Email Notifications
                      </span>
                    </div>
                    <Badge variant='primary'>24 sent today</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title='System Health'
                subtitle='Current system status'
              />
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <ChartBarIcon className='h-5 w-5 text-green-600' />
                      <span className='text-sm font-medium'>Database</span>
                    </div>
                    <Badge variant='success'>Healthy</Badge>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <CogIcon className='h-5 w-5 text-green-600' />
                      <span className='text-sm font-medium'>API Services</span>
                    </div>
                    <Badge variant='success'>Online</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities - Admin Specific */}
          <Card>
            <CardHeader
              title='Recent Activities'
              subtitle='Latest system activities and operations'
              action={
                <Button variant='ghost' size='sm'>
                  View All
                </Button>
              }
            />
            <CardContent>
              <div className='space-y-4'>
                {dashboardData.recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='flex-shrink-0'>
                        <activity.icon className='h-6 w-6 text-gray-600 dark:text-gray-400' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                          {activity.description}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
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
        </div>
      </Layout>
    </AdminRoute>
  );
}
