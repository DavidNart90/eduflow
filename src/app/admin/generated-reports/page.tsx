'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth-context-simple';
import { useToast } from '@/hooks/useToast';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Input,
  Checkbox,
} from '@/components/ui';
import {
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';

interface GeneratedReport {
  id: string;
  report_type: string;
  file_name: string;
  file_url: string | null;
  file_size: number;
  generation_params: Record<string, unknown>;
  teacher_id: string | null;
  teacher_name?: string;
  generated_by: string;
  download_count: number;
  created_at: string;
}

export default function GeneratedReportsPage() {
  const { session, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk download states
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  const fetchReports = useCallback(
    async (accessToken: string) => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch('/api/admin/generated-reports', {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data.reports || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch reports';
        showError('Failed to Load Reports', errorMessage);
        setError(errorMessage); // Keep for UI state if needed
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  // Handle authentication state changes
  useEffect(() => {
    if (authLoading) {
      // Still loading auth, don't do anything
      return;
    }

    if (!session) {
      // Auth is loaded but no session - this shouldn't happen in a protected route
      setLoading(false);
      showError('Authentication Required', 'Please log in to access this page');
      setError('Authentication required');
      return;
    }

    if (session.access_token) {
      // We have a session with token, fetch reports
      fetchReports(session.access_token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session?.access_token, fetchReports]);

  const filterReports = useCallback(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        report =>
          report.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Report type filter
    if (reportTypeFilter) {
      filtered = filtered.filter(
        report => report.report_type === reportTypeFilter
      );
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= filterDate;
      });
    }

    setFilteredReports(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [reports, searchTerm, reportTypeFilter, dateFilter]);

  useEffect(() => {
    filterReports();
    // Clear selections when filters change
    setSelectedReports([]);
  }, [filterReports]);

  const handleDownload = async (reportId: string, fileName: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if session is available
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/admin/generated-reports/${reportId}/download`,
        {
          method: 'POST',
          credentials: 'include',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh reports to update download count
      if (session?.access_token) {
        fetchReports(session.access_token);
      }

      // Show success message
      showSuccess('Download Successful', `Successfully downloaded ${fileName}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to download report';
      showError('Download Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedReports.length === 0) {
      showError(
        'Selection Required',
        'Please select at least one report to download'
      );
      return;
    }

    try {
      setIsBulkDownloading(true);
      setError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if session is available
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        '/api/admin/generated-reports/bulk-download',
        {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            reportIds: selectedReports,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download reports');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `reports_bulk_download_${new Date().toISOString().split('T')[0]}.zip`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Clear selections and refresh reports to update download counts
      setSelectedReports([]);
      if (session?.access_token) {
        fetchReports(session.access_token);
      }

      // Show success message
      showSuccess(
        'Bulk Download Successful',
        `Successfully downloaded ${selectedReports.length} reports`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to download reports';
      showError('Bulk Download Failed', errorMessage);
      setError(errorMessage);
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleSelectReport = (reportId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedReports(currentReports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const reportTypeOptions = [
    { value: '', label: 'All Report Types' },
    { value: 'teacher_statement', label: 'Teacher Statement' },
    { value: 'association_summary', label: 'Association Summary' },
    { value: 'quarterly_report', label: 'Quarterly Report' },
  ];

  // Pagination logic
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminRoute>
        <Layout>
          <div className='p-6'>
            <div className='animate-pulse'>
              <div className='h-8 bg-slate-200 rounded w-1/4 mb-6'></div>
              <div className='space-y-4'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className='h-16 bg-slate-200 rounded'></div>
                ))}
              </div>
            </div>
          </div>
        </Layout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Header */}
          <div className='mb-6'>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent'>
              Generated Reports
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-2'>
              View and download all generated reports. Select multiple reports
              using checkboxes for bulk download.
            </p>
          </div>

          {error && (
            <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>
            </div>
          )}

          {/* Filters and Search */}
          <Card variant='glass' className='mb-6'>
            <CardContent className='p-4'>
              <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
                <div className='flex flex-col md:flex-row gap-4 items-center flex-1'>
                  {/* Search */}
                  <div className='relative flex-1 max-w-md'>
                    <Input
                      type='text'
                      placeholder='Search reports...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                    <EyeIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  </div>

                  {/* Filters Toggle */}
                  <Button
                    variant='outline'
                    onClick={() => setShowFilters(!showFilters)}
                    icon={<FunnelIcon className='h-4 w-4' />}
                  >
                    Filters
                  </Button>

                  {/* Bulk Download Button - Always visible but disabled when no selection */}
                  <Button
                    variant={selectedReports.length > 0 ? 'primary' : 'outline'}
                    onClick={handleBulkDownload}
                    disabled={isBulkDownloading || selectedReports.length === 0}
                    icon={<CloudArrowDownIcon className='h-4 w-4' />}
                    className={
                      selectedReports.length > 0
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        : ''
                    }
                  >
                    {isBulkDownloading
                      ? 'Downloading...'
                      : selectedReports.length > 0
                        ? `Download ${selectedReports.length} Report${selectedReports.length > 1 ? 's' : ''}`
                        : 'Bulk Download'}
                  </Button>
                </div>

                <div className='flex items-center gap-4'>
                  {selectedReports.length > 0 ? (
                    <div className='text-sm text-blue-600 dark:text-blue-400 font-medium'>
                      {selectedReports.length} selected
                    </div>
                  ) : (
                    <div className='text-sm text-slate-500 dark:text-slate-500'>
                      Select reports to enable bulk download
                    </div>
                  )}
                  <div className='text-sm text-slate-600 dark:text-slate-400'>
                    {filteredReports.length} of {reports.length} reports
                  </div>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className='mt-4 pt-4 border-t border-slate-200 dark:border-slate-700'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Report Type
                      </label>
                      <Select
                        value={reportTypeFilter}
                        onChange={setReportTypeFilter}
                        options={reportTypeOptions}
                        placeholder='All types'
                        className='w-full'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Date From
                      </label>
                      <Input
                        type='date'
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className='w-full'
                      />
                    </div>

                    <div className='flex items-end'>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setSearchTerm('');
                          setReportTypeFilter('');
                          setDateFilter('');
                        }}
                        className='w-full'
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card variant='glass'>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-slate-50 dark:bg-slate-800/50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        <Checkbox
                          checked={
                            currentReports.length > 0 &&
                            currentReports.every(report =>
                              selectedReports.includes(report.id)
                            )
                          }
                          onChange={e => handleSelectAll(e.target.checked)}
                          label=''
                          className='text-xs'
                        />
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Report
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Type
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Teacher
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Size
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Downloads
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Created
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                    {currentReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='px-6 py-12 text-center'>
                          <DocumentTextIcon className='mx-auto h-12 w-12 text-slate-400' />
                          <p className='mt-4 text-slate-600 dark:text-slate-400'>
                            No reports found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      currentReports.map(report => (
                        <tr
                          key={report.id}
                          className='hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        >
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <Checkbox
                              checked={selectedReports.includes(report.id)}
                              onChange={e =>
                                handleSelectReport(report.id, e.target.checked)
                              }
                              label=''
                              className='text-xs'
                            />
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <DocumentTextIcon className='h-5 w-5 text-slate-400 mr-3' />
                              <div>
                                <div className='text-sm font-medium text-slate-900 dark:text-white'>
                                  {report.file_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <Badge
                              variant={
                                report.report_type === 'teacher_statement'
                                  ? 'primary'
                                  : 'secondary'
                              }
                              className='text-xs'
                            >
                              {report.report_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <UserIcon className='h-4 w-4 text-slate-400 mr-2' />
                              <span className='text-sm text-slate-900 dark:text-white'>
                                {report.teacher_name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400'>
                            {formatFileSize(report.file_size)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'>
                              {report.download_count}
                            </span>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center text-sm text-slate-600 dark:text-slate-400'>
                              <CalendarIcon className='h-4 w-4 mr-2' />
                              {formatDate(report.created_at)}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                handleDownload(report.id, report.file_name)
                              }
                              icon={<ArrowDownTrayIcon className='h-4 w-4' />}
                              className='text-primary hover:bg-blue-600 dark:hover:bg-blue-600/20'
                            >
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='px-6 py-4 border-t border-slate-200 dark:border-slate-700'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-slate-600 dark:text-slate-400'>
                      Showing {startIndex + 1} to{' '}
                      {Math.min(endIndex, filteredReports.length)} of{' '}
                      {filteredReports.length} results
                    </div>
                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AdminRoute>
  );
}
