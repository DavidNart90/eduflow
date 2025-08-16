'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-optimized';

export interface AdminDashboardData {
  totalTeachers: number;
  totalMoMo: number;
  totalController: number;
  interestPaid: number;
  pendingReports: number;
  recentActivities: Array<{
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
}

interface AdminDataHook extends AdminDataState {
  refetch: () => Promise<void>;
  clearError: () => void;
}

// Cache duration: 2 minutes for admin data
const CACHE_DURATION = 2 * 60 * 1000;

export function useAdminData(): AdminDataHook {
  const { user } = useAuth();
  const [state, setState] = useState<AdminDataState>({
    dashboardData: null,
    isLoading: true,
    error: null,
    lastFetched: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchAdminData = useCallback(
    async (forceRefresh = false) => {
      if (!user || user.role !== 'admin') {
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

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Simulate API delay for demo
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, these would be actual API calls to fetch admin data
        const mockData: AdminDashboardData = {
          totalTeachers: 1247,
          totalMoMo: 456890,
          totalController: 789234,
          interestPaid: 23456,
          pendingReports: 3,
          recentActivities: [
            {
              id: '1',
              type: 'Controller report uploaded',
              description: 'Controller report uploaded for December 2024',
              amount: '145 records processed • 2 hours ago',
              time: '2 hours ago',
              status: 'Processed',
              icon: 'DocumentArrowUpIcon',
            },
            {
              id: '2',
              type: 'New teacher account created',
              description: 'New teacher account created: John Asante',
              amount: 'Teacher ID: TCH001247 • 5 hours ago',
              time: '5 hours ago',
              status: 'New',
              icon: 'UsersIcon',
            },
            {
              id: '3',
              type: 'Monthly report generated',
              description: 'Monthly report generated for November 2024',
              amount: 'Sent to 1,240 teachers • 1 day ago',
              time: '1 day ago',
              status: 'Completed',
              icon: 'DocumentTextIcon',
            },
            {
              id: '4',
              type: 'Quarterly interest payment processed',
              description: 'Quarterly interest payment processed',
              amount: '₵23,456 distributed to 1,240 accounts • 2 days ago',
              time: '2 days ago',
              status: 'Completed',
              icon: 'CurrencyDollarIcon',
            },
            {
              id: '5',
              type: 'System maintenance completed',
              description: 'Database backup and optimization completed',
              amount: 'Backup size: 2.3GB • 3 days ago',
              time: '3 days ago',
              status: 'Completed',
              icon: 'CogIcon',
            },
          ],
        };

        setState({
          dashboardData: mockData,
          isLoading: false,
          error: null,
          lastFetched: now,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch admin data',
        }));
      }
    },
    [user, state.lastFetched, state.dashboardData]
  );

  const refetch = useCallback(async () => {
    await fetchAdminData(true);
  }, [fetchAdminData]);

  // Initial fetch and auth state changes
  useEffect(() => {
    if (user) {
      fetchAdminData();
    } else {
      setState({
        dashboardData: null,
        isLoading: false,
        error: null,
        lastFetched: null,
      });
    }
  }, [user, fetchAdminData]);

  return {
    dashboardData: state.dashboardData,
    isLoading: state.isLoading,
    error: state.error,
    lastFetched: state.lastFetched,
    refetch,
    clearError,
  };
}
