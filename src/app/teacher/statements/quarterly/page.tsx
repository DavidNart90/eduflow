'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  DashboardSkeleton,
} from '@/components/ui';
import {
  EyeIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface QuarterlyStatementData {
  quarter: string;
  year: number;
  status: 'available' | 'processing' | 'unavailable';
  downloadUrl?: string;
}

const QUARTERS = [
  { value: 'Q1', label: 'Q1 (Jan - Mar)' },
  { value: 'Q2', label: 'Q2 (Apr - Jun)' },
  { value: 'Q3', label: 'Q3 (Jul - Sep)' },
  { value: 'Q4', label: 'Q4 (Oct - Dec)' },
];

const YEARS = [2025, 2024, 2023, 2022, 2021];

export default function QuarterlyStatementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedQuarter, setSelectedQuarter] = useState('Q4');
  const [previousStatements, setPreviousStatements] = useState<
    QuarterlyStatementData[]
  >([]);

  // Check if user is actually a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  useEffect(() => {
    // Mock data for previous quarterly statements
    const mockStatements: QuarterlyStatementData[] = [
      {
        quarter: 'Q4',
        year: 2024,
        status: 'available',
        downloadUrl: '#',
      },
      {
        quarter: 'Q3',
        year: 2024,
        status: 'available',
        downloadUrl: '#',
      },
      {
        quarter: 'Q2',
        year: 2024,
        status: 'available',
        downloadUrl: '#',
      },
    ];

    const fetchQuarterlyStatements = () => {
      try {
        setLoading(true);

        // For now, using mock data
        // In production, replace with actual API call
        setTimeout(() => {
          setPreviousStatements(mockStatements);
          setLoading(false);
        }, 1000);
      } catch {
        setPreviousStatements(mockStatements); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuarterlyStatements();
    }
  }, [user]);

  const handleViewStatement = () => {
    // Implementation for viewing quarterly statement
    // This would typically open a PDF viewer or navigate to a statement details page
  };

  const handleDownload = () => {
    // Implementation for downloading quarterly statement
    // This would typically trigger a file download
  };

  const getStatusBadge = (status: QuarterlyStatementData['status']) => {
    const variants = {
      available: 'success',
      processing: 'warning',
      unavailable: 'error',
    } as const;

    const labels = {
      available: 'Available',
      processing: 'Processing',
      unavailable: 'Unavailable',
    };

    return (
      <Badge variant={variants[status]} dot size='sm'>
        {labels[status]}
      </Badge>
    );
  };

  // Early return if user is not a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <p>Redirecting...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <TeacherRoute>
        <Layout>
          <DashboardSkeleton />
        </Layout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <Layout>
        <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 md:p-6'>
          <div className='mx-auto max-w-7xl space-y-6'>
            {/* Header */}
            <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Quarterly Reports
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                  Secure Access
                </p>
              </div>
            </div>

            {/* About Section */}
            <Card variant='glass' padding='lg'>
              <CardContent>
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-green-100 dark:bg-green-900'>
                      <ChartBarIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                      About Your Quarterly Reports
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                      Here you can view and download your quarterly savings
                      reports. These comprehensive reports include summaries of
                      all activities, interest calculations, and performance
                      metrics for the selected quarter.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statement Selection */}
            <Card variant='glass' padding='lg'>
              <CardHeader title='Select Report Period' />
              <CardContent>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Year
                    </label>
                    <Select
                      value={selectedYear}
                      onChange={value => setSelectedYear(value)}
                      options={YEARS.map(year => ({
                        value: year.toString(),
                        label: year.toString(),
                      }))}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Quarter
                    </label>
                    <Select
                      value={selectedQuarter}
                      onChange={value => setSelectedQuarter(value)}
                      options={QUARTERS}
                    />
                  </div>

                  <div className='flex items-end'>
                    <Button
                      variant='primary'
                      onClick={handleViewStatement}
                      icon={<EyeIcon className='h-4 w-4' />}
                      className='w-full'
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Statements */}
            <Card variant='glass' padding='lg'>
              <CardHeader
                title='Previous Reports'
                subtitle='Quick access to your recent quarterly report downloads'
              />
              <CardContent>
                <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                  <table className='w-full min-w-[600px]'>
                    <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          QUARTER
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          YEAR
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          STATUS
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          DOWNLOAD
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className='px-6 py-4 text-center text-gray-500 dark:text-gray-400'
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : previousStatements.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'
                          >
                            No reports available
                          </td>
                        </tr>
                      ) : (
                        previousStatements.map((statement, index) => (
                          <tr
                            key={index}
                            className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200'
                          >
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {statement.quarter}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {statement.year}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {getStatusBadge(statement.status)}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {statement.status === 'available' ? (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleDownload()}
                                  icon={
                                    <ArrowDownTrayIcon className='h-4 w-4' />
                                  }
                                  className='text-blue-600 hover:text-blue-700'
                                >
                                  Download
                                </Button>
                              ) : (
                                <span className='text-gray-400 text-sm'>-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
