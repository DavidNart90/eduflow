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
  InformationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface StatementData {
  month: string;
  year: number;
  status: 'available' | 'processing' | 'unavailable';
  downloadUrl?: string;
}

const MONTHS = [
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [previousStatements, setPreviousStatements] = useState<StatementData[]>(
    []
  );

  // Check if user is actually a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  useEffect(() => {
    // Mock data for previous statements
    const mockStatements: StatementData[] = [
      {
        month: 'March',
        year: 2025,
        status: 'available',
        downloadUrl: '#',
      },
      {
        month: 'February',
        year: 2025,
        status: 'available',
        downloadUrl: '#',
      },
      {
        month: 'January',
        year: 2025,
        status: 'available',
        downloadUrl: '#',
      },
    ];

    const fetchStatements = () => {
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
      fetchStatements();
    }
  }, [user]);

  const handleViewStatement = () => {
    // Implementation for viewing statement
    // This would typically open a PDF viewer or navigate to a statement details page
  };

  const handleDownload = () => {
    // Implementation for downloading statement
    // This would typically trigger a file download
  };

  const getStatusBadge = (status: StatementData['status']) => {
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
                  Monthly Statements
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
                    <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-blue-100 dark:bg-blue-900'>
                      <InformationCircleIcon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                      About Your Statements
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                      Here you can view and download your monthly savings
                      statements. Statements include all Controller deductions,
                      MoMo contributions, and interest applied for the selected
                      month.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statement Selection */}
            <Card variant='glass' padding='lg'>
              <CardHeader title='Select Statement Period' />
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
                      Month
                    </label>
                    <Select
                      value={selectedMonth}
                      onChange={value => setSelectedMonth(value)}
                      options={MONTHS.map(month => ({
                        value: month,
                        label: month,
                      }))}
                    />
                  </div>

                  <div className='flex items-end'>
                    <Button
                      variant='primary'
                      onClick={handleViewStatement}
                      icon={<EyeIcon className='h-4 w-4' />}
                      className='w-full'
                    >
                      View Statement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Statements */}
            <Card variant='glass' padding='lg'>
              <CardHeader
                title='Previous Statements'
                subtitle='Quick access to your recent statement downloads'
              />
              <CardContent>
                <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                  <table className='w-full min-w-[600px]'>
                    <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          MONTH
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
                            No statements available
                          </td>
                        </tr>
                      ) : (
                        previousStatements.map((statement, index) => (
                          <tr
                            key={index}
                            className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200'
                          >
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {statement.month}
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
