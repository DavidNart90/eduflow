'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context-simple';
import { useToast } from '@/hooks/useToast';

interface NotificationData {
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
  metadata: Record<string, string | number | boolean | null>;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at: string | null;
  created_by_name?: string | null;
}

interface UseNotificationToastsOptions {
  enabled?: boolean;
  pollingInterval?: number;
  showOnlyNewNotifications?: boolean;
}

export const useNotificationToasts = (
  options: UseNotificationToastsOptions = {}
) => {
  const {
    enabled = true,
    pollingInterval = 30000, // 30 seconds
    showOnlyNewNotifications = true,
  } = options;

  const { user } = useAuth();
  const { addToast } = useToast();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const seenNotificationIds = useRef<Set<string>>(new Set());

  const checkForNewNotifications = useCallback(async () => {
    if (!user || !enabled || isPolling) return;

    setIsPolling(true);

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        is_read: 'false', // Only get unread notifications
      });

      if (lastChecked && showOnlyNewNotifications) {
        params.append('created_after', lastChecked.toISOString());
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const notifications: NotificationData[] = data.notifications || [];

        // Filter out notifications we've already shown
        const newNotifications = notifications.filter(
          notification => !seenNotificationIds.current.has(notification.id)
        );

        // Show toast for each new notification
        newNotifications.forEach(notification => {
          seenNotificationIds.current.add(notification.id);

          addToast({
            type: getToastType(notification.type, notification.priority),
            title: notification.title,
            message: truncateMessage(notification.message, 100),
            duration: getPriorityDuration(notification.priority),
            closable: true,
          });
        });

        setLastChecked(new Date());
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking for new notifications:', error);
    } finally {
      setIsPolling(false);
    }
  }, [
    user,
    enabled,
    isPolling,
    lastChecked,
    showOnlyNewNotifications,
    addToast,
  ]);

  const getToastType = (notificationType: string, priority: string) => {
    if (priority === 'urgent') return 'error';
    if (priority === 'high') return 'warning';

    switch (notificationType) {
      case 'momo_transaction':
      case 'interest_payment':
        return 'success';
      case 'admin_report':
      case 'controller_report':
        return 'info';
      case 'app_update':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPriorityDuration = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 10000; // 10 seconds for urgent
      case 'high':
        return 8000; // 8 seconds for high
      case 'normal':
        return 6000; // 6 seconds for normal
      case 'low':
        return 4000; // 4 seconds for low
      default:
        return 6000;
    }
  };

  const truncateMessage = (message: string, maxLength: number) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Start polling when component mounts and user is authenticated
  useEffect(() => {
    if (!user || !enabled) return undefined;

    // Initial check
    checkForNewNotifications();

    // Set up polling interval
    intervalRef.current = setInterval(
      checkForNewNotifications,
      pollingInterval
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, enabled, pollingInterval, checkForNewNotifications]);

  // Check immediately when user logs in
  useEffect(() => {
    if (user && enabled) {
      setLastChecked(new Date());
      // Clear seen notifications when user changes
      seenNotificationIds.current.clear();
    }
  }, [user, enabled]);

  const startPolling = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(
      checkForNewNotifications,
      pollingInterval
    );
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkNow = () => {
    checkForNewNotifications();
  };

  return {
    isPolling,
    lastChecked,
    checkNow,
    startPolling,
    stopPolling,
    seenCount: seenNotificationIds.current.size,
  };
};

export default useNotificationToasts;
