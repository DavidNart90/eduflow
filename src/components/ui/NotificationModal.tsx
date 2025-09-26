'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  BellIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, string | number | boolean | null>;
  is_read: boolean;
  priority: string;
  created_at: string;
  read_at: string | null;
  created_by_name?: string | null;
}

interface NotificationModalProps {
  notification: NotificationData | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  const iconClass = 'h-8 w-8';

  switch (type) {
    case 'momo_transaction':
      return <PhoneIcon className={iconClass} />;
    case 'admin_report':
      return <DocumentArrowDownIcon className={iconClass} />;
    case 'controller_report':
      return <DocumentArrowDownIcon className={iconClass} />;
    case 'app_update':
      return <ArrowPathIcon className={iconClass} />;
    case 'interest_payment':
      return <BanknotesIcon className={iconClass} />;
    case 'system':
      return <BellIcon className={iconClass} />;
    default:
      return <BellIcon className={iconClass} />;
  }
};

const getNotificationColor = (type: string, priority: string) => {
  if (priority === 'urgent') return 'error';
  if (priority === 'high') return 'warning';

  switch (type) {
    case 'momo_transaction':
      return 'success';
    case 'admin_report':
      return 'info';
    case 'controller_report':
      return 'primary';
    case 'app_update':
      return 'secondary';
    case 'interest_payment':
      return 'success';
    case 'system':
      return 'info';
    default:
      return 'secondary';
  }
};

const getPriorityIcon = (priority: string) => {
  const iconClass = 'h-5 w-5';

  switch (priority) {
    case 'urgent':
      return (
        <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />
      );
    case 'high':
      return (
        <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />
      );
    default:
      return null;
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

const getTypeDisplayName = (type: string) => {
  switch (type) {
    case 'momo_transaction':
      return 'Mobile Money Transaction';
    case 'admin_report':
      return 'Admin Report';
    case 'controller_report':
      return 'Controller Report';
    case 'app_update':
      return 'App Update';
    case 'interest_payment':
      return 'Interest Payment';
    case 'system':
      return 'System Notification';
    default:
      return 'Notification';
  }
};

const getPriorityDisplayName = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High Priority';
    case 'normal':
      return 'Normal';
    case 'low':
      return 'Low Priority';
    default:
      return 'Normal';
  }
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !notification) {
    return null;
  }

  const iconColor = getNotificationColor(
    notification.type,
    notification.priority
  );
  const priorityIcon = getPriorityIcon(notification.priority);
  const { date, time } = formatDateTime(notification.created_at);

  const handleMarkAsRead = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification.id);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur morphism */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' />

      {/* Modal */}
      <div className='relative max-w-2xl w-full max-h-[90vh] overflow-hidden'>
        <div className='bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200/50 dark:border-slate-700/50'>
            <div className='flex items-start justify-between'>
              <div className='flex items-start space-x-4'>
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl p-3',
                    'bg-gradient-to-br shadow-lg',
                    iconColor === 'success' &&
                      'from-green-500 to-green-600 text-white',
                    iconColor === 'info' &&
                      'from-blue-500 to-blue-600 text-white',
                    iconColor === 'warning' &&
                      'from-yellow-500 to-yellow-600 text-white',
                    iconColor === 'error' &&
                      'from-red-500 to-red-600 text-white',
                    iconColor === 'primary' &&
                      'from-purple-500 to-purple-600 text-white',
                    iconColor === 'secondary' &&
                      'from-gray-500 to-gray-600 text-white'
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-2 mb-1'>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                      {notification.title}
                    </h2>
                    {priorityIcon}
                    {!notification.is_read && (
                      <div className='w-3 h-3 bg-blue-500 rounded-full flex-shrink-0' />
                    )}
                  </div>

                  <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                    <span className='flex items-center space-x-1'>
                      <ClockIcon className='h-4 w-4' />
                      <span>
                        {date} at {time}
                      </span>
                    </span>
                    {notification.created_by_name && (
                      <span>by {notification.created_by_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>

            {/* Tags */}
            <div className='flex items-center space-x-2 mt-3'>
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  iconColor === 'success' &&
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  iconColor === 'info' &&
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                  iconColor === 'warning' &&
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                  iconColor === 'error' &&
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  iconColor === 'primary' &&
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                  iconColor === 'secondary' &&
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                )}
              >
                {getTypeDisplayName(notification.type)}
              </span>

              {(notification.priority === 'urgent' ||
                notification.priority === 'high') && (
                <span
                  className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    notification.priority === 'urgent'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  )}
                >
                  {getPriorityDisplayName(notification.priority)}
                </span>
              )}

              {notification.is_read && (
                <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'>
                  <CheckCircleIcon className='h-3 w-3 mr-1' />
                  Read
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className='px-6 py-6 max-h-96 overflow-y-auto'>
            <div className='prose dark:prose-invert max-w-none'>
              <p className='text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap'>
                {notification.message}
              </p>
            </div>

            {/* Metadata */}
            {notification.metadata &&
              Object.keys(notification.metadata).length > 0 && (
                <div className='mt-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>
                    Additional Details
                  </h4>
                  <div className='space-y-2'>
                    {Object.entries(notification.metadata).map(
                      ([key, value]) => (
                        <div key={key} className='flex justify-between text-sm'>
                          <span className='font-medium text-gray-500 dark:text-gray-400 capitalize'>
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className='text-gray-900 dark:text-white'>
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className='px-6 py-4 border-t border-gray-200/50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30'>
            <div className='flex items-center justify-between'>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                {notification.read_at ? (
                  <span>
                    Read on {formatDateTime(notification.read_at).date} at{' '}
                    {formatDateTime(notification.read_at).time}
                  </span>
                ) : (
                  <span>Not yet read</span>
                )}
              </div>

              <div className='flex items-center space-x-3'>
                {!notification.is_read && onMarkAsRead && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleMarkAsRead}
                    className='text-blue-600 border-blue-600 hover:bg-blue-50'
                  >
                    <CheckCircleIcon className='h-4 w-4 mr-2' />
                    Mark as Read
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleDelete}
                    className='text-red-600 border-red-600 hover:bg-red-50'
                  >
                    <XMarkIcon className='h-4 w-4 mr-2' />
                    Delete
                  </Button>
                )}

                <Button variant='primary' size='sm' onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
