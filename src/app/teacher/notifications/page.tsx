'use client';

import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth-context-simple';
import { NotificationList } from '@/components/ui/NotificationList';
import { useNotifications } from '@/hooks/useNotifications';

export default function TeacherNotificationsPage() {
  useAuth();

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
    refreshInterval: 30000,
    initialLimit: 20,
  });

  return (
    <TeacherRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Header */}
          <div className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
                <h1 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                  My Notifications
                </h1>
                <p className='text-slate-600 dark:text-slate-400 mt-1 md:mt-2 text-base md:text-lg'>
                  Stay updated with your savings activities and important
                  announcements
                </p>
              </div>
            </div>
          </div>

          {/* Notifications List */}
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
      </Layout>
    </TeacherRoute>
  );
}
