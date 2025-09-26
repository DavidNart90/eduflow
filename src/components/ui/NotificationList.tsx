'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Pagination,
  Badge,
  NotificationCard,
} from '@/components/ui';
import NotificationModal from './NotificationModal';
import { MuiSkeletonComponent } from './Skeleton';
import {
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  ArrowPathIcon,
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

interface NotificationSummary {
  total_count: number;
  unread_count: number;
  high_priority_unread: number;
  recent_count: number;
}

interface NotificationListProps {
  notifications: NotificationData[];
  summary: NotificationSummary;
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: {
    type?: string;
    is_read?: boolean;
    priority?: string;
    search?: string;
  }) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  compact?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  summary,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'momo_transaction', label: 'MoMo Transactions' },
    { value: 'admin_report', label: 'Admin Reports' },
    { value: 'controller_report', label: 'Controller Reports' },
    { value: 'app_update', label: 'App Updates' },
    { value: 'interest_payment', label: 'Interest Payments' },
    { value: 'system', label: 'System' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'read', label: 'Read Only' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ];

  // Handle filter changes
  useEffect(() => {
    if (onFilterChange) {
      const filters: {
        type?: string;
        is_read?: boolean;
        priority?: string;
        search?: string;
      } = {};

      if (selectedType !== 'all') filters.type = selectedType;
      if (selectedStatus === 'unread') filters.is_read = false;
      if (selectedStatus === 'read') filters.is_read = true;
      if (selectedPriority !== 'all') filters.priority = selectedPriority;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      onFilterChange(filters);
    }
  }, [
    searchQuery,
    selectedType,
    selectedStatus,
    selectedPriority,
    onFilterChange,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  const handleNotificationClick = (notification: NotificationData) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    // Mark as read when opened
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  if (error) {
    return (
      <Card variant='default' className='p-6'>
        <div className='text-center'>
          <div className='text-red-500 mb-2'>
            <BellIcon className='h-12 w-12 mx-auto opacity-50' />
          </div>
          <h3 className='text-lg font-medium text-red-900 dark:text-red-100 mb-2'>
            Failed to Load Notifications
          </h3>
          <p className='text-red-700 dark:text-red-300 mb-4'>{error}</p>
          {onRefresh && (
            <Button variant='outline' onClick={onRefresh}>
              <ArrowPathIcon className='h-4 w-4 mr-2' />
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Statistics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card variant='glass' className='p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-500 rounded-lg'>
              <BellIcon className='h-5 w-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Total</p>
              <p className='text-xl font-bold'>{summary.total_count}</p>
            </div>
          </div>
        </Card>

        <Card variant='glass' className='p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-orange-500 rounded-lg'>
              <BellIcon className='h-5 w-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Unread</p>
              <p className='text-xl font-bold'>{summary.unread_count}</p>
            </div>
          </div>
        </Card>

        <Card variant='glass' className='p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-red-500 rounded-lg'>
              <BellIcon className='h-5 w-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                High Priority
              </p>
              <p className='text-xl font-bold'>
                {summary.high_priority_unread}
              </p>
            </div>
          </div>
        </Card>

        <Card variant='glass' className='p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-green-500 rounded-lg'>
              <BellIcon className='h-5 w-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Recent</p>
              <p className='text-xl font-bold'>{summary.recent_count}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card variant='glass' className='p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <FunnelIcon className='h-5 w-5 text-gray-600' />
          <h3 className='text-lg font-semibold'>Filters & Actions</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Search</label>
            <Input
              placeholder='Search notifications...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className='h-4 w-4' />}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Type</label>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              options={typeOptions}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Priority</label>
            <Select
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorityOptions}
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <Button variant='outline' onClick={handleClearFilters} size='sm'>
            Clear Filters
          </Button>

          {onMarkAllAsRead && summary.unread_count > 0 && (
            <Button variant='primary' onClick={onMarkAllAsRead} size='sm'>
              <CheckIcon className='h-4 w-4 mr-2' />
              Mark All Read ({summary.unread_count})
            </Button>
          )}

          {onRefresh && (
            <Button variant='ghost' onClick={onRefresh} size='sm'>
              <ArrowPathIcon className='h-4 w-4 mr-2' />
              Refresh
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <Card variant='glass'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold'>Notifications</h3>
            {pagination && (
              <Badge variant='secondary'>
                {pagination.total} notification
                {pagination.total !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className='flex items-start space-x-4 p-4'>
                  <MuiSkeletonComponent
                    variant='circular'
                    width={40}
                    height={40}
                    animation='pulse'
                  />
                  <div className='flex-1 space-y-2'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width='60%'
                      height={20}
                      animation='pulse'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width='90%'
                      height={16}
                      animation='pulse'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width='40%'
                      height={14}
                      animation='pulse'
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-center py-12'>
              <BellIcon className='h-16 w-16 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                No notifications found
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                {searchQuery ||
                selectedType !== 'all' ||
                selectedStatus !== 'all'
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You have no notifications at this time.'}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClick={handleNotificationClick}
                  compact={compact}
                  maxMessageLength={compact ? 80 : 120}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0'>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} notifications
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={
                  onPageChange ||
                  (() => {
                    /* no-op */
                  })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
      />
    </div>
  );
};

export default NotificationList;
