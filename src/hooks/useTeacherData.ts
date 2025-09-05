import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-simple';
import { useTeacherStore } from '@/lib/stores';

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
    interest: number;
    count: number;
  };
  interest_setting: {
    interest_rate: number;
    payment_frequency: string;
  };
}

interface UseTeacherDataOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  minLoadingTime?: number; // Minimum time to wait before showing demo data
}

export function useTeacherData(options: UseTeacherDataOptions = {}) {
  const {
    enableAutoRefresh = false,
    refreshInterval = 60000,
    minLoadingTime = 3000,
  } = options;
  const { user, session } = useAuth();
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

  // Dashboard API call function - simplified
  const dashboardApiCall = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/teacher/dashboard', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }

    return data;
  }, [session?.access_token]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id || apiStatus === 'loading') {
      return;
    }

    const startTime = Date.now();
    setApiStatus('loading');
    setLoading(true);

    try {
      const data = await dashboardApiCall();
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
    } catch (error) {
      // Calculate elapsed time and wait for minimum loading time if needed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      // Wait for minimum loading time before showing demo data
      setTimeout(() => {
        setApiStatus('error');
        setDataSource('mock');
        setError(error instanceof Error ? error.message : 'Unknown error');
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
            interest: 180.25,
            count: 15,
          },
          interest_setting: {
            interest_rate: 0.0425,
            payment_frequency: 'quarterly',
          },
        };

        setDashboardData(defaultData);
        setBalance(12450.75);
        setTransactions(defaultData.recent_transactions);
      }, remainingTime);
    }
  }, [
    user?.id,
    user?.full_name,
    user?.employee_id,
    user?.management_unit,
    user?.email,
    user?.phone_number,
    apiStatus,
    dashboardApiCall,
    setBalance,
    setTransactions,
    setLoading,
    setError,
    minLoadingTime,
  ]);

  // Effect to fetch data when user is available
  useEffect(() => {
    if (user?.id && apiStatus === 'idle') {
      fetchDashboardData();
    }
  }, [user?.id, apiStatus, fetchDashboardData]);

  // Setup auto-refresh if enabled (simplified)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (enableAutoRefresh && dashboardData && apiStatus === 'success') {
      intervalId = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    enableAutoRefresh,
    refreshInterval,
    dashboardData,
    apiStatus,
    fetchDashboardData,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  const refreshData = useCallback(() => {
    setApiStatus('idle'); // Reset to trigger refetch
  }, []);

  return {
    dashboardData,
    dataSource,
    apiStatus,
    loading,
    refreshData,
  };
}
