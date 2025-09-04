'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context-simple';
import { useApiCall } from './useOptimizedEffects';

export interface AdminDashboardData {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  systemStats: {
    total_teachers: number;
    active_teachers: number;
    total_savings: number;
    monthly_contributions: number;
    pending_reports: number;
    system_health: 'good' | 'warning' | 'error';
    controller_reports_uploaded: number;
    emails_sent: number;
  };
  recent_activities: Array<{
    id: string;
    user_id: string;
    amount: number;
    transaction_type: 'momo' | 'controller' | 'interest' | 'deposit';
    payment_method?: 'mobile_money' | 'bank' | 'cash';
    transaction_date: string;
    status: 'pending' | 'completed' | 'failed';
    description?: string;
    users?: {
      full_name: string;
      employee_id: string;
    };
  }>;
  // Calculated fields for display
  totalMoMo?: number;
  totalController?: number;
  interestPaid?: number;
  pendingReports?: number;
  trends?: {
    teachers: number;
    totalContributions: number;
    momoContributions: number;
    controllerContributions: number;
  };
  monthlyBreakdown?: {
    current: {
      total: number;
      momo: number;
      controller: number;
    };
    previous: {
      total: number;
      momo: number;
      controller: number;
    };
  };
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    amount?: string;
    time: string;
    status: string;
    icon: string;
  }>;
}

interface AdminDataState {
  dashboardData: AdminDashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  dataSource: 'api' | 'mock' | 'empty';
}

interface AdminDataHook extends AdminDataState {
  refetch: () => void;
  clearError: () => void;
}

// Cache duration: 2 minutes for admin data
const CACHE_DURATION = 2 * 60 * 1000;

export function useAdminData(): AdminDataHook {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminDataState>({
    dashboardData: null,
    isLoading: true,
    error: null,
    lastFetched: null,
    dataSource: 'api',
  });

  // Add a delay state to prevent premature API calls
  const [initializationDelay, setInitializationDelay] = useState(true);
  // Track successful API calls to prevent fallback override
  const [hasSuccessfulResponse, setHasSuccessfulResponse] = useState(false);

  // Clear the initialization delay after auth is loaded and user is available
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setInitializationDelay(false);
      }, 1000); // Reduced from 2000ms to 1000ms for faster loading

      return () => clearTimeout(timer);
    }

    // Always return a cleanup function (no-op when no timer is set)
    return () => {
      // No cleanup needed when timer is not set
    };
  }, [authLoading, user]);
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Admin dashboard API call function
  const fetchDashboardData = useCallback(async () => {
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin dashboard data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  // Use the enhanced API call hook
  const { refetch: refetchDashboard } = useApiCall(
    fetchDashboardData,
    [user?.id, user?.role], // Simplified dependencies
    {
      enabled: Boolean(
        !authLoading &&
          !initializationDelay &&
          user?.id &&
          user?.role === 'admin'
      ), // Wait for auth to load AND initialization delay
      retryOnTokenRefresh: true,
      maxRetries: 1, // Reduce retries to prevent multiple error messages
      onSuccess: data => {
        const typedData = data as AdminDashboardData;

        // Mark that we have a successful response
        setHasSuccessfulResponse(true);

        // Transform the data for UI compatibility
        const transformedData = {
          ...typedData,
          // Use the API-provided totals (calculated from ALL transactions) instead of recalculating from recent activities
          totalMoMo: typedData.totalMoMo || 0,
          totalController: typedData.totalController || 0,
          interestPaid: typedData.interestPaid || 0,
          pendingReports: typedData.systemStats.pending_reports,
          recentActivities: transformActivities(
            typedData.recent_activities || []
          ),
        };

        setState(prev => ({
          ...prev,
          dashboardData: transformedData,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          dataSource: 'api',
        }));
      },
      onError: error => {
        // Only fallback to mock data if we haven't received a successful response
        if (hasSuccessfulResponse) {
          // Already have real data, don't override with mock data
          return;
        }

        // Be more conservative about showing mock data
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(
            'Admin dashboard API failed, using fallback data:',
            error.message
          );
        }

        // Create mock data immediately for better UX
        const mockData: AdminDashboardData = {
          user: {
            id: user?.id || '',
            full_name: user?.full_name || 'Admin User',
            email: user?.email || '',
            role: 'admin',
          },
          systemStats: {
            total_teachers: 25,
            active_teachers: 23,
            total_savings: 450000,
            monthly_contributions: 32500,
            pending_reports: 2,
            system_health: 'good' as const,
            controller_reports_uploaded: 3,
            emails_sent: 12,
          },
          recent_activities: [],
          totalMoMo: 180000,
          totalController: 270000,
          interestPaid: 12500,
          pendingReports: 2,
          trends: {
            teachers: 8.3,
            totalContributions: 12.5,
            momoContributions: 15.2,
            controllerContributions: 9.8,
          },
          monthlyBreakdown: {
            current: {
              total: 32500,
              momo: 15000,
              controller: 17500,
            },
            previous: {
              total: 28900,
              momo: 13200,
              controller: 15700,
            },
          },
          recentActivities: [
            {
              id: '1',
              type: 'momo',
              description: 'Mobile Money payment received from Demo Teacher',
              amount: 'GHS 500.00 • 2 hours ago',
              time: '2 hours ago',
              status: 'Completed',
              icon: 'CurrencyDollarIcon',
            },
            {
              id: '2',
              type: 'controller',
              description: 'Controller report entry for Demo Teacher (EMP001)',
              amount: 'GHS 750.00 • 1 day ago',
              time: '1 day ago',
              status: 'Completed',
              icon: 'DocumentArrowUpIcon',
            },
          ],
        };

        // Set mock data immediately
        setState(prev => ({
          ...prev,
          dashboardData: mockData,
          isLoading: false,
          error: null,
          dataSource: 'mock',
          lastFetched: Date.now(),
        }));
      },
    }
  );

  const fetchAdminData = useCallback(
    (forceRefresh = false) => {
      // Wait for auth to load completely AND initialization delay
      if (authLoading || initializationDelay) {
        setState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      // Don't immediately fail if user is not admin - let the loading state persist
      // The admin route component will handle redirects
      if (!user) {
        // User not loaded yet, keep loading
        setState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      if (user.role !== 'admin') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Access denied: Admin role required',
        }));
        return;
      }

      // Check cache validity
      const now = Date.now();
      const isDataStale =
        !state.lastFetched || now - state.lastFetched > CACHE_DURATION;

      if (!forceRefresh && !isDataStale && state.dashboardData) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Reset success flag when starting a new fetch
      setHasSuccessfulResponse(false);

      // Ensure loading state is set before API call
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Trigger the API call
      refetchDashboard();
    },
    [
      authLoading,
      initializationDelay,
      user,
      state.lastFetched,
      state.dashboardData,
      refetchDashboard,
    ]
  );

  const refetch = useCallback(() => {
    fetchAdminData(true);
  }, [fetchAdminData]);

  // Initial fetch and auth state changes
  useEffect(() => {
    if (user && !authLoading && !initializationDelay) {
      // Reset success flag when user changes
      setHasSuccessfulResponse(false);
      fetchAdminData();
    } else if (!user && !authLoading) {
      // Only clear loading when auth is complete and user is definitely not available
      setHasSuccessfulResponse(false);
      setState({
        dashboardData: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        dataSource: 'api',
      });
    }
    // Keep loading state when auth is still loading or during initialization delay
  }, [user, authLoading, initializationDelay, fetchAdminData]);

  return {
    dashboardData: state.dashboardData,
    isLoading: authLoading || initializationDelay || state.isLoading, // Include both auth loading and initialization delay
    error: state.error,
    lastFetched: state.lastFetched,
    dataSource: state.dataSource,
    refetch,
    clearError,
  };
}

// Helper functions for data transformation
function transformActivities(
  activities: AdminDashboardData['recent_activities']
) {
  return activities.slice(0, 5).map(activity => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'momo':
          return 'CurrencyDollarIcon';
        case 'controller':
          return 'DocumentArrowUpIcon';
        case 'interest':
          return 'CurrencyDollarIcon';
        default:
          return 'DocumentTextIcon';
      }
    };

    const getDescription = (
      activity: AdminDashboardData['recent_activities'][0]
    ) => {
      const userName = activity.users?.full_name || 'Unknown Teacher';
      const employeeId = activity.users?.employee_id || '';

      switch (activity.transaction_type) {
        case 'momo':
          return `Mobile Money payment received from ${userName}`;
        case 'controller':
          return `Controller report entry for ${userName} (${employeeId})`;
        case 'interest':
          return `Quarterly interest payment to ${userName}`;
        default:
          return `Transaction by ${userName}`;
      }
    };

    const getStatus = (status: string) => {
      if (status === 'completed') {
        return 'Completed';
      }
      if (status === 'pending') {
        return 'Pending';
      }
      if (status === 'failed') {
        return 'Failed';
      }
      return 'Unknown';
    };

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
      }).format(amount);
    };

    const formatTime = (dateString: string) => {
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

    return {
      id: activity.id,
      type: activity.transaction_type,
      description: getDescription(activity),
      amount: `${formatAmount(activity.amount)} • ${formatTime(activity.transaction_date)}`,
      time: formatTime(activity.transaction_date),
      status: getStatus(activity.status),
      icon: getIcon(activity.transaction_type),
    };
  });
}
