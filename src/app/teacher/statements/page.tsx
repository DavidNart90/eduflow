'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-optimized';
import { useTeacherReports } from '@/hooks/useTeacherReports';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
} from '@/components/ui';
import {
  InformationCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const MONTHS = [
  'All',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = [2025, 2024, 2023, 2022, 2021];

export default function StatementsPage() {
  const { user } = useAuth();
  const { reports, loading, error, fetchReports, downloadReport } =
    useTeacherReports();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [filteredReports, setFilteredReports] = useState(reports);

  // Filter reports based on search criteria
  useEffect(() => {
    let filtered = reports;

    // Filter by selected year (always filter by year)
    if (selectedYear) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        const reportYear = reportDate.getFullYear().toString();
        return reportYear === selectedYear;
      });
    }

    // Filter by selected month (only if not "All")
    if (selectedMonth && selectedMonth !== 'All') {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        const reportMonth = reportDate.toLocaleDateString('en-US', {
          month: 'long',
        });
        return reportMonth === selectedMonth;
      });
    }

    setFilteredReports(filtered);
  }, [reports, selectedYear, selectedMonth]);

  // Fetch reports on component mount
  useEffect(() => {
    if (user && reports.length === 0) {
      fetchReports();
    }
  }, [user, reports.length, fetchReports]);

  const handleFilterAndDownload = () => {
    // Apply the filtering (already handled by useEffect)
    // If there are filtered reports, download the most recent one
    if (filteredReports.length > 0) {
      const mostRecentReport = filteredReports[0]; // Reports are sorted by created_at desc
      downloadReport(mostRecentReport.id, mostRecentReport.file_name);
    } else {
      // If no reports found for the selected period, just refresh
      fetchReports();
    }
  };

  const handleDownload = (reportId: string, fileName: string) => {
    downloadReport(reportId, fileName);
  };

  const getStatusBadge = (report: { expires_at?: string | null }) => {
    // Determine status based on report data
    const isExpired =
      report.expires_at && new Date(report.expires_at) < new Date();
    const status = isExpired ? 'unavailable' : 'available';

    const variants = {
      available: 'success',
      processing: 'warning',
      unavailable: 'error',
    } as const;

    const labels = {
      available: 'Available',
      processing: 'Processing',
      unavailable: 'Expired',
    };

    return (
      <Badge variant={variants[status]} dot size='sm'>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <TeacherRoute>
        <Layout>
          <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 p-4 md:p-6'>
            <div className='mx-auto max-w-7xl space-y-6'>
              {/* Header Skeleton */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 w-80 animate-pulse'></div>
                    <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-60 animate-pulse'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 mt-2 animate-pulse'></div>
                  </div>
                  <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse'></div>
                </div>
              </div>

              {/* About Section Skeleton */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                padding='lg'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-start space-x-4'>
                    <div className='h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse'></div>
                    <div className='flex-1 space-y-3'>
                      <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 animate-pulse'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse'></div>
                      <div className='flex flex-wrap gap-2 mt-4'>
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className='h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse'
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statement Selection Skeleton */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                padding='lg'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='mb-6'>
                    <div className='h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mb-2 animate-pulse'></div>
                    <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-80 animate-pulse'></div>
                  </div>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse'></div>
                        <div className='h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse'></div>
                      </div>
                    ))}
                  </div>
                  <div className='mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl'>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse'></div>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Statements Skeleton */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                padding='lg'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='mb-6'>
                    <div className='h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mb-2 animate-pulse'></div>
                    <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-80 animate-pulse'></div>
                  </div>

                  {/* Table Skeleton */}
                  <div className='overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700'>
                    <table className='w-full min-w-[600px]'>
                      <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                        <tr>
                          {['MONTH', 'YEAR', 'STATUS', 'DOWNLOAD'].map(
                            header => (
                              <th key={header} className='px-6 py-4'>
                                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse'></div>
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                        {[1, 2, 3, 4].map(i => (
                          <tr key={i} className='bg-white dark:bg-slate-900'>
                            <td className='px-6 py-4'>
                              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse'></div>
                            </td>
                            <td className='px-6 py-4'>
                              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse'></div>
                            </td>
                            <td className='px-6 py-4'>
                              <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse'></div>
                            </td>
                            <td className='px-6 py-4'>
                              <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse'></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className='mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl'>
                    <div className='flex items-start space-x-3'>
                      <div className='h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'></div>
                      <div className='space-y-2 flex-1'>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse'></div>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <Layout>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 p-4 md:p-6'>
          <div className='mx-auto max-w-7xl space-y-6'>
            {/* Header */}
            <div className='mb-6 md:mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='lg:w-full'>
                  <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                    Monthly Savings Statements
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                    Secure Document Access
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                    View and download your detailed monthly savings statements
                  </p>
                </div>
                <Badge
                  variant='primary'
                  className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                >
                  Teacher
                </Badge>
              </div>
            </div>

            {/* About Section */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              padding='lg'
            >
              <CardContent className='p-1 md:p-6'>
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                      <InformationCircleIcon className='h-6 w-6' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent mb-3'>
                      About Your Monthly Statements
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base'>
                      Access your comprehensive monthly savings statements that
                      include all Controller deductions, Mobile Money
                      contributions, interest earnings, and account balance
                      details. All statements are generated automatically and
                      available for secure download.
                    </p>
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <Badge variant='success' size='sm' className='text-xs'>
                        ✓ Automated Generation
                      </Badge>
                      <Badge variant='primary' size='sm' className='text-xs'>
                        ✓ Secure Download
                      </Badge>
                      <Badge variant='secondary' size='sm' className='text-xs'>
                        ✓ Complete Transaction History
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card
                variant='glass'
                className='border-red-200 bg-red-50 dark:bg-red-900/20'
                padding='lg'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center'>
                        <InformationCircleIcon className='h-5 w-5 text-red-600 dark:text-red-400' />
                      </div>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-red-800 dark:text-red-200'>
                        Error Loading Reports
                      </h4>
                      <p className='text-sm text-red-700 dark:text-red-300'>
                        {error}
                      </p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={fetchReports}
                        className='mt-2 text-red-700 dark:text-red-300'
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statement Selection */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              padding='lg'
            >
              <CardHeader
                title='Filter & Download Statements'
                subtitle='Select the period and filter your monthly savings statements'
              />
              <CardContent className='p-2 md:p-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      <CalendarIcon className='h-4 w-4 mr-2 text-primary' />
                      Year
                    </label>
                    <Select
                      value={selectedYear}
                      onChange={value => setSelectedYear(value)}
                      options={YEARS.map(year => ({
                        value: year.toString(),
                        label: year.toString(),
                      }))}
                      variant='filled'
                    />
                  </div>

                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      <CalendarIcon className='h-4 w-4 mr-2 text-primary' />
                      Month
                    </label>
                    <Select
                      value={selectedMonth}
                      onChange={value => setSelectedMonth(value)}
                      options={MONTHS.map(month => ({
                        value: month,
                        label: month,
                      }))}
                      variant='filled'
                    />
                  </div>

                  <div className='flex items-end'>
                    <Button
                      variant='primary'
                      onClick={handleFilterAndDownload}
                      icon={<ArrowDownTrayIcon className='h-4 w-4' />}
                      className='w-full bg-gradient-to-r text-dark dark:text-white from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg'
                      size='md'
                    >
                      Filter & Download
                    </Button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50'>
                  <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400'>
                    <DocumentTextIcon className='h-4 w-4 text-blue-500' />
                    <span>
                      Filtering for{' '}
                      <strong>
                        {selectedMonth === 'All' ? 'All months' : selectedMonth}{' '}
                        {selectedYear}
                      </strong>{' '}
                      - showing {filteredReports.length} matching reports in the
                      table below.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Statements */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 shadow-xl'
              padding='lg'
            >
              <CardHeader
                title='Previous Statements'
                subtitle='Quick access to your recent statement downloads'
              />
              <CardContent className='p-4 md:p-6'>
                <div className='overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'>
                  <table className='w-full min-w-[600px]'>
                    <thead className='bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700'>
                      <tr>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Month
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Year
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Status
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className='px-6 py-8 text-center text-slate-500 dark:text-slate-400'
                          >
                            <div className='flex items-center justify-center space-x-2'>
                              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary'></div>
                              <span>Loading statements...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={4} className='px-6 py-12 text-center'>
                            <div className='flex flex-col items-center space-y-3'>
                              <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center'>
                                <DocumentTextIcon className='h-8 w-8 text-slate-400' />
                              </div>
                              <div className='text-center'>
                                <p className='text-lg font-medium text-slate-900 dark:text-slate-100'>
                                  No statements available
                                </p>
                                <p className='text-slate-500 dark:text-slate-400'>
                                  Reports will appear when generated by admin
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report, index) => {
                          const reportDate = new Date(report.created_at);
                          const isExpired =
                            report.expires_at &&
                            new Date(report.expires_at) < new Date();

                          return (
                            <tr
                              key={report.id}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                                index % 2 === 0
                                  ? 'bg-white dark:bg-slate-900/50'
                                  : 'bg-slate-50/50 dark:bg-slate-800/25'
                              }`}
                            >
                              <td className='px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap'>
                                {reportDate.toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className='px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap'>
                                {reportDate.getFullYear()}
                              </td>
                              <td className='px-6 py-4 text-sm whitespace-nowrap'>
                                {getStatusBadge(report)}
                              </td>
                              <td className='px-6 py-4 text-sm whitespace-nowrap'>
                                {!isExpired ? (
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleDownload(
                                        report.id,
                                        report.file_name
                                      )
                                    }
                                    icon={
                                      <ArrowDownTrayIcon className='h-4 w-4' />
                                    }
                                    className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  >
                                    Download PDF ({report.download_count})
                                  </Button>
                                ) : (
                                  <span className='text-slate-400 dark:text-slate-500 text-sm italic'>
                                    Expired
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Additional Info */}
                <div className='mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border border-slate-200/50 dark:border-slate-700/50'>
                  <div className='flex items-start space-x-3'>
                    <InformationCircleIcon className='h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0' />
                    <div className='text-sm text-slate-600 dark:text-slate-400'>
                      <p className='font-medium text-slate-700 dark:text-slate-300 mb-1'>
                        Statement Information
                      </p>
                      <p>
                        Statements are automatically generated on the 5th of
                        each month and include all transactions from the
                        previous month. Download links are available for 12
                        months.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
