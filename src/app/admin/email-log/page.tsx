'use client';

import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { NotificationList } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const {
    notifications,
    summary,
    pagination,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    setPage,
    refresh,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    initialLimit: 20,
  });

  return (
    <AdminRoute>
      <Layout>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 p-4 md:p-6'>
          <div className='mx-auto max-w-8xl space-y-6'>
            {/* Header */}
            <div className='mb-6 md:mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='lg:w-full'>
                  <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                    Notification Center
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                    In-App Notification Management
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                    Manage all system notifications and alerts for users and
                    administrators
                  </p>
                </div>
                <Badge
                  variant='primary'
                  className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  icon={<BellIcon className='h-4 w-4' />}
                >
                  Notifications
                </Badge>
              </div>
            </div>

            {/* Notification Management Info */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
            >
              <div className='p-6'>
                <div className='flex items-center space-x-3 mb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white'>
                    <Cog6ToothIcon className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                      Notification System Features
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      Real-time notifications for all users and system events
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span>MoMo Transaction Alerts</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <span>Report Generation Alerts</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                    <span>Controller Report Updates</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                    <span>Interest Payment Notifications</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                    <span>App Update Alerts</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                    <span>System Notifications</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                    <span>Priority-based Delivery</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300'>
                    <div className='w-2 h-2 bg-indigo-500 rounded-full'></div>
                    <span>Real-time Updates</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notifications List Component */}
            <NotificationList
              notifications={notifications}
              summary={summary}
              loading={loading}
              error={error}
              pagination={pagination || undefined}
              onPageChange={setPage}
              onFilterChange={setFilters}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onRefresh={refresh}
            />
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
