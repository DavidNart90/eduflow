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
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  InformationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarIcon,
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
        }, 3000);
      } catch {
        setPreviousStatements(mockStatements); // Fallback to mock data
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
          <div className='p-4 md:p-6 min-h-screen'>
            {/* Loading State */}
            <div className='space-y-8'>
              {/* Header Skeleton */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={350}
                      height={40}
                      animation='pulse'
                      className='rounded-lg mb-3'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={280}
                      height={20}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={80}
                    height={32}
                    animation='pulse'
                    className='rounded-full'
                  />
                </div>
              </div>

              {/* Cards Skeleton */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card
                    key={index}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div className='space-y-2'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={150}
                              height={24}
                              animation='pulse'
                              className='rounded-md'
                            />
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={200}
                              height={16}
                              animation='pulse'
                              className='rounded-md'
                            />
                          </div>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={48}
                            height={48}
                            animation='pulse'
                            className='rounded-full'
                          />
                        </div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={160}
                          height={40}
                          animation='pulse'
                          className='rounded-md'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width='100%'
                          height={48}
                          animation='pulse'
                          className='rounded-xl'
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Loading Statement Selection */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                padding='lg'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='mb-6'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={200}
                      height={28}
                      animation='pulse'
                      className='mb-2 rounded-lg'
                    />
                  </div>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={'50%'}
                          height={16}
                          animation='pulse'
                          className='mb-2 rounded'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={'100%'}
                          height={40}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Loading Previous Statements */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                padding='lg'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='mb-6'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={200}
                      height={28}
                      animation='pulse'
                      className='mb-2 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={300}
                      height={20}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>

                  {/* Loading Table */}
                  <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                    <table className='w-full min-w-[600px]'>
                      <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                        <tr>
                          {['MONTH', 'YEAR', 'STATUS', 'DOWNLOAD'].map(
                            header => (
                              <th key={header} className='px-6 py-3'>
                                <MuiSkeletonComponent
                                  variant='rectangular'
                                  width={'80%'}
                                  height={16}
                                  animation='pulse'
                                  className='rounded'
                                />
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                        {[1, 2, 3, 4].map(i => (
                          <tr key={i}>
                            {[1, 2, 3, 4].map(j => (
                              <td key={j} className='px-6 py-4'>
                                <MuiSkeletonComponent
                                  variant='rectangular'
                                  width={j === 4 ? '60%' : '80%'}
                                  height={16}
                                  animation='pulse'
                                  className='rounded'
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
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

            {/* Statement Selection */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              padding='lg'
            >
              <CardHeader
                title='Generate Statement'
                subtitle='Select the period for your monthly savings statement'
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
                      onClick={handleViewStatement}
                      icon={<EyeIcon className='h-4 w-4' />}
                      className='w-full bg-gradient-to-r text-dark dark:text-white from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg'
                      size='md'
                    >
                      Generate & View Statement
                    </Button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50'>
                  <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400'>
                    <DocumentTextIcon className='h-4 w-4 text-blue-500' />
                    <span>
                      Statements for{' '}
                      <strong>
                        {selectedMonth} {selectedYear}
                      </strong>{' '}
                      will include all transactions, deductions, and interest
                      for that period.
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
                      ) : previousStatements.length === 0 ? (
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
                                  Generate your first statement using the form
                                  above
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        previousStatements.map((statement, index) => (
                          <tr
                            key={index}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                              index % 2 === 0
                                ? 'bg-white dark:bg-slate-900/50'
                                : 'bg-slate-50/50 dark:bg-slate-800/25'
                            }`}
                          >
                            <td className='px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap'>
                              {statement.month}
                            </td>
                            <td className='px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap'>
                              {statement.year}
                            </td>
                            <td className='px-6 py-4 text-sm whitespace-nowrap'>
                              {getStatusBadge(statement.status)}
                            </td>
                            <td className='px-6 py-4 text-sm whitespace-nowrap'>
                              {statement.status === 'available' ? (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleDownload()}
                                  icon={
                                    <ArrowDownTrayIcon className='h-4 w-4' />
                                  }
                                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                >
                                  Download PDF
                                </Button>
                              ) : (
                                <span className='text-slate-400 dark:text-slate-500 text-sm italic'>
                                  Not available
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
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
