'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  BellIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  BanknotesIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NotificationToastProps {
  id: string;
  type:
    | 'momo_transaction'
    | 'admin_report'
    | 'controller_report'
    | 'app_update'
    | 'interest_payment'
    | 'system';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  onClose: (id: string) => void;
  onClick?: () => void;
  duration?: number;
}

const getNotificationIcon = (type: string) => {
  const iconClass = 'h-5 w-5';

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

const getNotificationColor = (type: string, priority: string = 'normal') => {
  if (priority === 'urgent') return 'red';
  if (priority === 'high') return 'yellow';

  switch (type) {
    case 'momo_transaction':
      return 'green';
    case 'admin_report':
      return 'blue';
    case 'controller_report':
      return 'purple';
    case 'app_update':
      return 'gray';
    case 'interest_payment':
      return 'green';
    case 'system':
      return 'blue';
    default:
      return 'gray';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  priority = 'normal',
  onClose,
  onClick,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const color = getNotificationColor(type, priority);
  const icon = getNotificationIcon(type);

  const handleClose = React.useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    handleClose();
  };

  // Auto-dismiss functionality
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, handleClose]);

  // Animation effect
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out',
        isVisible && !isRemoving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95',
        onClick && 'cursor-pointer hover:shadow-xl'
      )}
      onClick={onClick ? handleClick : undefined}
    >
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <div
              className={cn(
                'flex items-center justify-center rounded-full p-2',
                color === 'green' &&
                  'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
                color === 'blue' &&
                  'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                color === 'purple' &&
                  'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
                color === 'yellow' &&
                  'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
                color === 'red' &&
                  'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
                color === 'gray' &&
                  'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
              )}
            >
              {icon}
            </div>
          </div>

          <div className='ml-3 w-0 flex-1'>
            <p
              className={cn(
                'text-sm font-medium',
                color === 'green' && 'text-green-900 dark:text-green-100',
                color === 'blue' && 'text-blue-900 dark:text-blue-100',
                color === 'purple' && 'text-purple-900 dark:text-purple-100',
                color === 'yellow' && 'text-yellow-900 dark:text-yellow-100',
                color === 'red' && 'text-red-900 dark:text-red-100',
                color === 'gray' && 'text-gray-900 dark:text-gray-100'
              )}
            >
              {title}
            </p>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
              {message}
            </p>
            {priority === 'urgent' || priority === 'high' ? (
              <div className='mt-2'>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    priority === 'urgent'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  )}
                >
                  {priority === 'urgent' ? '🚨 Urgent' : '⚠️ High Priority'}
                </span>
              </div>
            ) : null}
          </div>

          <div className='ml-4 flex-shrink-0 flex'>
            <button
              className='bg-white dark:bg-slate-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <span className='sr-only'>Close</span>
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
