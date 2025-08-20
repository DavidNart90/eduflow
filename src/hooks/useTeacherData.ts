import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-optimized';
import { useTeacherStore } from '@/lib/stores';
import { supabase } from '@/lib/supabase';
import { useApiCall } from './useOptimizedEffects';

interface TeacherDashboardData {
  user: {
    id: string;
    full_name: string;
    employee_id: string;
    management_unit: string;
    email: string;
    phone_number?: string;
  };
  balance: number;
  monthlyContribution: number;
  monthlyTarget: number;
  contributionCount: number;
  recent_transactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    transaction_type: 'momo' | 'controller' | 'interest';
    transaction_date: Date;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    balance: number;
  }>;
  monthly_summary: {
    total: number;
    momo: number;
    controller: number;
    interest: number;
    contributionCount: number;
  };
  trend_percentage: number;
  current_month_year: {
    month: string;
    year: number;
  };
  total_contributions: {
    total: number;
    momo: number;
    controller: number;
    count: number;
  };
}

interface UseTeacherDataOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export function useTeacherData(options: UseTeacherDataOptions = {}) {
  const { enableAutoRefresh = false, refreshInterval = 30000 } = options;
  const { user, validateSession } = useAuth();
  const { loading, setBalance, setTransactions, setLoading, setError } =
    useTeacherStore();

  const [dashboardData, setDashboardData] =
    useState<TeacherDashboardData | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock' | 'empty'>('api');
  const [apiStatus, setApiStatus] = useState<
    'loading' | 'success' | 'error' | 'idle'
  >('idle');

  // Use refs to prevent unnecessary re-fetches
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dashboard API call function
  const dashboardApiCall = useCallback(async () => {
    // Validate session before making API call
    const isSessionValid = await validateSession();
    if (!isSessionValid) {
      throw new Error('Invalid session - please log in again');
    }

    // Get the session token
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/teacher/dashboard', {
      headers: {
        Authorization: `Bearer ${currentSession.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }

    return data;
  }, [validateSession]);

  // Use the enhanced API call hook
  const { refetch: refetchDashboard } = useApiCall(
    dashboardApiCall,
    [user?.id], // Dependencies
    {
      enabled: Boolean(user?.id),
      retryOnTokenRefresh: true,
      maxRetries: 2,
      onSuccess: data => {
        const typedData = data as TeacherDashboardData;
        setDashboardData(typedData);
        setBalance(typedData.balance || 0);
        setTransactions(typedData.recent_transactions || []);
        setApiStatus('success');
        setLoading(false);

        // Determine data source based on actual content
        if (
          typedData.balance === 0 &&
          (!typedData.recent_transactions ||
            typedData.recent_transactions.length === 0)
        ) {
          setDataSource('empty');
        } else {
          setDataSource('api');
        }

        setError(null);
      },
      onError: error => {
        // Dashboard API Error - using fallback data
        setApiStatus('error');
        setDataSource('mock');
        setError(error.message);
        setLoading(false);

        // Fallback to mock data
        const defaultData: TeacherDashboardData = {
          user: {
            id: user?.id || '',
            full_name: user?.full_name || 'Demo User',
            employee_id: user?.employee_id || 'EMP001',
            management_unit: user?.management_unit || 'Demo Unit',
            email: user?.email || '',
            phone_number: user?.phone_number,
          },
          balance: 12450.75,
          monthlyContribution: 1250.5,
          monthlyTarget: 1500,
          contributionCount: 3,
          recent_transactions: [
            {
              id: '1',
              user_id: user?.id || '',
              amount: 500.0,
              transaction_type: 'momo',
              transaction_date: new Date('2024-01-15'),
              description: 'Mobile Money Payment',
              status: 'completed',
              balance: 12450.75,
            },
          ],
          monthly_summary: {
            total: 1250.5,
            momo: 500.0,
            controller: 750.5,
            interest: 0,
            contributionCount: 3,
          },
          trend_percentage: 5.2,
          current_month_year: {
            month: 'January',
            year: 2024,
          },
          total_contributions: {
            total: 12450.75,
            momo: 5000.0,
            controller: 7450.75,
            count: 15,
          },
        };

        setDashboardData(defaultData);
        setBalance(12450.75);
        setTransactions(defaultData.recent_transactions);
      },
    }
  );

  // Effect to manage loading state when user changes
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      setApiStatus('loading');
    }
  }, [user?.id, setLoading]);

  // Initial loading state when component mounts
  useEffect(() => {
    if (user?.id && apiStatus === 'idle') {
      setLoading(true);
      setApiStatus('loading');
    }
  }, [user?.id, apiStatus, setLoading]);

  // Setup auto-refresh if enabled
  useEffect(() => {
    if (enableAutoRefresh && dashboardData && apiStatus === 'success') {
      refreshIntervalRef.current = setInterval(() => {
        refetchDashboard();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [
    enableAutoRefresh,
    refreshInterval,
    dashboardData,
    apiStatus,
    refetchDashboard,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const refreshData = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

  return {
    dashboardData,
    dataSource,
    apiStatus,
    loading,
    refreshData,
  };
}
