import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-simple';
import { useTeacherStore, GeneratedReport } from '@/lib/stores';

interface UseTeacherReportsReturn {
  reports: GeneratedReport[];
  loading: boolean;
  error: string | null;
  fetchReports: () => Promise<void>;
  downloadReport: (reportId: string, fileName: string) => Promise<void>;
}

export function useTeacherReports(): UseTeacherReportsReturn {
  const { session } = useAuth();
  const {
    reports,
    setReports,
    updateReportDownloadCount,
    setLoading,
    setError,
    loading,
    error,
  } = useTeacherStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!session?.access_token) {
      setError('No authentication token available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher/reports', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.reports) {
        setReports(data.reports);
      } else {
        throw new Error(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
      // Error logged for development debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching teacher reports:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, setLoading, setError, setReports]);

  const downloadReport = async (reportId: string, fileName: string) => {
    if (!session?.access_token) {
      setError('No authentication token available');
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);

      const response = await fetch(
        `/api/teacher/reports/${reportId}/download`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Update download count in local state
      updateReportDownloadCount(reportId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to download report';
      setError(errorMessage);
      // Error logged for development debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error downloading report:', err);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-fetch reports when component mounts or session changes
  useEffect(() => {
    let isMounted = true;

    if (session?.access_token && reports.length === 0 && isMounted) {
      fetchReports();
    }

    return () => {
      isMounted = false;
    };
  }, [session?.access_token, fetchReports, reports.length]);

  return {
    reports,
    loading: loading || isDownloading,
    error,
    fetchReports,
    downloadReport,
  };
}
