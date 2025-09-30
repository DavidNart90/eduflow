'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context-simple';
import { useAppStore } from '@/lib/stores';
// import { useNotificationToasts } from '@/hooks/useNotificationToasts'; // DISABLED - no auto polling
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import { ToastContainer } from './ui';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const { error, clearError } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // REMOVED: useNotificationToasts - completely disabled to prevent auto-polling
  // useNotificationToasts({
  //   enabled: false, // Disable automatic polling
  //   showOnlyNewNotifications: true,
  // });

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600 dark:text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400'>
            Please log in to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Error Banner */}
        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <svg
                  className='h-5 w-5 text-red-400 mr-3'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
                <p className='text-sm text-red-800 dark:text-red-200'>
                  {error}
                </p>
              </div>
              <button
                onClick={clearError}
                className='text-red-400 hover:text-red-600 dark:hover:text-red-300'
              >
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className='px-6 py-3'>
          <Breadcrumbs />
        </div>

        {/* Page content */}
        <main className='flex-1 overflow-auto md:p-5'>
          <div className='mx-auto'>{children}</div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
