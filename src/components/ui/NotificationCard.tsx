import React from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button } from '@/components/ui';
import {
  BellIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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

interface NotificationCardProps {
  notification: NotificationData;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
  compact?: boolean;
  maxMessageLength?: number;
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
  const iconClass = 'h-4 w-4';

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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
  maxMessageLength = 120,
}) => {
  const {
    id,
    type,
    title,
    message,
    is_read,
    priority,
    created_at,
    created_by_name,
  } = notification;

  const iconColor = getNotificationColor(type, priority);
  const priorityIcon = getPriorityIcon(priority);

  // Truncate message if it's too long
  const truncateMessage = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const displayMessage = truncateMessage(message, maxMessageLength);
  const isMessageTruncated = message.length > maxMessageLength;

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    if (!is_read && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <Card
      variant='default'
      className={cn(
        'transition-all duration-200 hover:shadow-modern-lg cursor-pointer',
        !is_read &&
          'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={handleClick}
    >
      <div className='flex items-start space-x-3'>
        {/* Notification Icon */}
        <div
          className={cn(
            'flex items-center justify-center rounded-full p-2',
            'bg-gradient-to-br shadow-sm',
            iconColor === 'success' && 'from-green-500 to-green-600 text-white',
            iconColor === 'info' && 'from-blue-500 to-blue-600 text-white',
            iconColor === 'warning' &&
              'from-yellow-500 to-yellow-600 text-white',
            iconColor === 'error' && 'from-red-500 to-red-600 text-white',
            iconColor === 'primary' &&
              'from-purple-500 to-purple-600 text-white',
            iconColor === 'secondary' && 'from-gray-500 to-gray-600 text-white'
          )}
        >
          {getNotificationIcon(type)}
        </div>

        {/* Notification Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center space-x-2 mb-1'>
                <h4
                  className={cn(
                    'text-sm font-semibold truncate',
                    !is_read
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {title}
                </h4>
                {priorityIcon}
                {!is_read && (
                  <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0' />
                )}
              </div>

              {!compact && (
                <div className='mb-2'>
                  <p
                    className={cn(
                      'text-sm line-clamp-2',
                      !is_read
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {displayMessage}
                  </p>
                  {isMessageTruncated && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleClick();
                      }}
                      className='text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 font-medium'
                    >
                      Read more...
                    </button>
                  )}
                </div>
              )}

              <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400'>
                <ClockIcon className='h-3 w-3' />
                <span>{formatRelativeTime(created_at)}</span>
                {created_by_name && (
                  <>
                    <span>•</span>
                    <span>by {created_by_name}</span>
                  </>
                )}
                <Badge variant={iconColor} size='sm'>
                  {type.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center space-x-1 ml-2'>
              {!is_read && onMarkAsRead && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleMarkAsRead}
                  className='text-gray-400 hover:text-blue-600 p-1'
                  title='Mark as read'
                >
                  <CheckCircleIcon className='h-4 w-4' />
                </Button>
              )}

              {onDelete && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDelete}
                  className='text-gray-400 hover:text-red-600 p-1'
                  title='Delete notification'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationCard;
