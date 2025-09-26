import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  priority?: string;
  search?: string;
}

interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialPage?: number;
  initialLimit?: number;
}

interface UseNotificationsReturn {
  notifications: NotificationData[];
  summary: NotificationSummary;
  pagination: NotificationPagination | null;
  loading: boolean;
  error: string | null;
  filters: NotificationFilters;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  setFilters: (filters: NotificationFilters) => void;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    initialPage = 1,
    initialLimit = 20,
  } = options;

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({
    total_count: 0,
    unread_count: 0,
    high_priority_unread: 0,
    recent_count: 0,
  });
  const [pagination, setPagination] = useState<NotificationPagination | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<NotificationFilters>({});
  const [page, setPageState] = useState(initialPage);

  // Get auth token for API calls
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: initialLimit.toString(),
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.is_read !== undefined)
        params.append('is_read', filters.is_read.toString());
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      setNotifications([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, initialLimit, filters, getAuthToken]);

  // Fetch notification summary
  const fetchSummary = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/notifications/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || summary);
      }
    } catch {
      // Silently fail for summary - not critical
    }
  }, [getAuthToken, summary]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = await getAuthToken();
        if (!token) return false;

        const response = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Update local state
          setNotifications(prev =>
            prev.map(notification =>
              notification.id === id
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
            )
          );

          // Update summary
          setSummary(prev => ({
            ...prev,
            unread_count: Math.max(0, prev.unread_count - 1),
          }));

          return true;
        }

        return false;
      } catch {
        return false;
      }
    },
    [getAuthToken]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      if (!token) return false;

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await response.json();

        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );

        // Update summary
        setSummary(prev => ({
          ...prev,
          unread_count: 0,
          high_priority_unread: 0,
        }));

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [getAuthToken]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = await getAuthToken();
        if (!token) return false;

        const response = await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Update local state
          setNotifications(prev =>
            prev.filter(notification => notification.id !== id)
          );

          // Update summary
          setSummary(prev => ({
            ...prev,
            total_count: Math.max(0, prev.total_count - 1),
          }));

          return true;
        }

        return false;
      } catch {
        return false;
      }
    },
    [getAuthToken]
  );

  // Set filters
  const setFilters = useCallback((newFilters: NotificationFilters) => {
    setFiltersState(newFilters);
    setPageState(1); // Reset to first page when filters change
  }, []);

  // Set page
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchSummary();
  }, [fetchNotifications, fetchSummary]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      fetchSummary(); // Only refresh summary for auto-refresh to avoid disrupting user
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSummary]);

  return {
    notifications,
    summary,
    pagination,
    loading,
    error,
    filters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    setPage,
    refresh,
  };
}
