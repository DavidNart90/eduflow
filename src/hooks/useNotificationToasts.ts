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
    enabled = false, // Changed default to false - no auto-polling
    pollingInterval = 30000, // 30 seconds
    showOnlyNewNotifications = true,
  } = options;

  const { user } = useAuth();
  const { addToast } = useToast();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const lastCheckedRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const checkFnRef = useRef<(() => Promise<void>) | null>(null);

  const stopPollingRef = useRef<(() => void) | null>(null);

  stopPollingRef.current = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkForNewNotifications = useCallback(async () => {
    if (!user || !enabled || !isMountedRef.current) return;

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        is_read: 'false', // Only get unread notifications
      });

      if (lastCheckedRef.current && showOnlyNewNotifications) {
        params.append('created_after', lastCheckedRef.current.toISOString());
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
      });

      // Stop polling if unauthorized or forbidden
      if (response.status === 401 || response.status === 403) {
        // eslint-disable-next-line no-console
        console.warn('Authentication failed, stopping notification polling');
        if (stopPollingRef.current) {
          stopPollingRef.current();
        }
        return;
      }

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

        const now = new Date();
        lastCheckedRef.current = now;
        setLastChecked(now);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking for new notifications:', error);
    }
  }, [user, enabled, showOnlyNewNotifications, addToast]);

  // Keep ref updated with latest callback
  checkFnRef.current = checkForNewNotifications;

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
    // STRICTLY prevent any polling when disabled
    if (!enabled) {
      // Clear any existing interval immediately
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    if (!user) {
      // Clear any existing interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    // Initial check - use ref to get latest version
    if (checkFnRef.current) {
      checkFnRef.current();
    }

    // Set up polling interval - use ref so it always calls latest version
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (checkFnRef.current) {
          checkFnRef.current();
        }
      }, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, enabled, pollingInterval]);

  // Check immediately when user logs in
  useEffect(() => {
    if (user && enabled) {
      const now = new Date();
      lastCheckedRef.current = now;
      setLastChecked(now);
      // Clear seen notifications when user changes
      seenNotificationIds.current.clear();
    }
  }, [user, enabled]);

  // Track component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startPolling = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (checkFnRef.current) {
        checkFnRef.current();
      }
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkNow = () => {
    if (checkFnRef.current) {
      checkFnRef.current();
    }
  };

  return {
    lastChecked,
    checkNow,
    startPolling,
    stopPolling,
    seenCount: seenNotificationIds.current.size,
  };
};

export default useNotificationToasts;
