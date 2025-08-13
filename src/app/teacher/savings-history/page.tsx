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
  Pagination,
  Input,
  Select,
  DashboardSkeleton,
} from '@/components/ui';
import {
  CurrencyDollarIcon,
  PhoneIcon,
  UserIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface SavingsHistoryData {
  totalBalance: number;
  totalMomoContributions: number;
  totalControllerContributions: number;
  interestEarned: number;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    source: 'momo' | 'controller' | 'interest' | 'withdrawal';
    amount: number;
    runningBalance: number;
  }>;
}

interface FilterState {
  startDate: string;
  endDate: string;
  source: 'all' | 'momo' | 'controller' | 'interest' | 'withdrawal';
  search: string;
}

// Mock data for demonstration - replace with actual API call
const mockData: SavingsHistoryData = {
  totalBalance: 8649.85,
  totalMomoContributions: 3250.0,
  totalControllerContributions: 4815.6,
  interestEarned: 584.25,
  transactions: [
    {
      id: '1',
      date: '01/15/2025',
      description: 'Voluntary Deposit',
      source: 'momo',
      amount: 75.0,
      runningBalance: 8594.85,
    },
    {
      id: '2',
      date: '01/14/2025',
      description: 'Monthly Deduction',
      source: 'controller',
      amount: 75.0,
      runningBalance: 8519.85,
    },
    {
      id: '3',
      date: '01/13/2025',
      description: 'Voluntary Deposit',
      source: 'momo',
      amount: 50.0,
      runningBalance: 8544.85,
    },
    {
      id: '4',
      date: '12/06/2024',
      description: 'Withdrawal',
      source: 'withdrawal',
      amount: -3477.0,
      runningBalance: 5217.85,
    },
    {
      id: '5',
      date: '10/06/2024',
      description: 'Interest Applied (Q4)',
      source: 'interest',
      amount: 984.25,
      runningBalance: 8069.85,
    },
  ],
};

export default function SavingsHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SavingsHistoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    source: 'all',
    search: '',
  });

  const itemsPerPage = 10;

  // Check if user is actually a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  useEffect(() => {
    const fetchSavingsHistory = () => {
      try {
        setLoading(true);

        // For now, using mock data
        // In production, replace with actual API call
        setTimeout(() => {
          setData(mockData);
          setLoading(false);
        }, 1000);

        // Actual implementation would be:
        // const response = await fetch('/api/teacher/savings-history', {
        //   headers: {
        //     Authorization: `Bearer ${session.access_token}`,
        //   },
        // });
        // const result = await response.json();
        // setData(result);
      } catch {
        // In development, we'll skip logging the error
        setData(mockData); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSavingsHistory();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(Math.abs(amount));
  };

  const getSourceBadge = (source: string) => {
    const variants = {
      momo: 'primary',
      controller: 'secondary',
      interest: 'success',
      withdrawal: 'error',
    } as const;

    const icons = {
      momo: <PhoneIcon className='h-3 w-3' />,
      controller: <UserIcon className='h-3 w-3' />,
      interest: <ChartBarIcon className='h-3 w-3' />,
      withdrawal: <ArrowDownTrayIcon className='h-3 w-3' />,
    };

    const labels = {
      momo: 'MoMo',
      controller: 'Controller',
      interest: '% Interest',
      withdrawal: 'Withdrawal',
    };

    return (
      <Badge
        variant={variants[source as keyof typeof variants] || 'secondary'}
        icon={icons[source as keyof typeof icons]}
        iconPosition='left'
        size='sm'
      >
        {labels[source as keyof typeof labels] || source}
      </Badge>
    );
  };

  // Filter and paginate transactions
  const filteredTransactions =
    data?.transactions.filter(transaction => {
      if (filters.source !== 'all' && transaction.source !== filters.source) {
        return false;
      }
      if (
        filters.search &&
        !transaction.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      // Add date filtering logic here if needed
      return true;
    }) || [];

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    // Implementation for CSV export
    // Create CSV content and download
  };

  const handleExportPDF = () => {
    // Implementation for PDF export
    // Generate PDF and download
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
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
                  Savings History
                </h1>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                  Complete Record
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card
                variant='glass'
                className='hover:scale-105 transition-transform duration-300'
              >
                <CardContent>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-primary-500 text-white'>
                        <CurrencyDollarIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Total Savings Balance
                      </p>
                      <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {data && formatCurrency(data.totalBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='hover:scale-105 transition-transform duration-300'
              >
                <CardContent>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-blue-500 text-white'>
                        <PhoneIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Total MoMo Contributions
                      </p>
                      <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {data && formatCurrency(data.totalMomoContributions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='hover:scale-105 transition-transform duration-300'
              >
                <CardContent>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-purple-500 text-white'>
                        <UserIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Total Controller Contributions
                      </p>
                      <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {data &&
                          formatCurrency(data.totalControllerContributions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='hover:scale-105 transition-transform duration-300'
              >
                <CardContent>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-success-500 text-white'>
                        <ChartBarIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Interest Earned to Date
                      </p>
                      <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {data && formatCurrency(data.interestEarned)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Transaction History */}
            <Card variant='glass' padding='lg'>
              <CardHeader
                title='Transaction History'
                subtitle='Complete record of all your savings activities'
              />

              {/* Filters */}
              <div className='mb-6 space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6'>
                  <div className='md:col-span-1'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Start Date
                    </label>
                    <Input
                      type='date'
                      value={filters.startDate}
                      onChange={e =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                    />
                  </div>

                  <div className='md:col-span-1'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      End Date
                    </label>
                    <Input
                      type='date'
                      value={filters.endDate}
                      onChange={e =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                    />
                  </div>

                  <div className='md:col-span-1'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Transaction Source
                    </label>
                    <Select
                      value={filters.source}
                      onChange={value =>
                        setFilters({
                          ...filters,
                          source: value as FilterState['source'],
                        })
                      }
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'momo', label: 'MoMo' },
                        { value: 'controller', label: 'Controller' },
                        { value: 'interest', label: 'Interest' },
                        { value: 'withdrawal', label: 'Withdrawal' },
                      ]}
                    />
                  </div>

                  <div className='md:col-span-1'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Search
                    </label>
                    <Input
                      type='text'
                      placeholder='Search by month or notes'
                      value={filters.search}
                      onChange={e =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      leftIcon={<MagnifyingGlassIcon className='h-4 w-4' />}
                    />
                  </div>

                  <div className='md:col-span-1 flex items-end'>
                    <Button
                      variant='primary'
                      onClick={handleApplyFilters}
                      icon={<FunnelIcon className='h-4 w-4' />}
                      className='w-full'
                    >
                      Apply Filters
                    </Button>
                  </div>

                  <div className='md:col-span-1 flex items-end space-x-2'>
                    <Button
                      variant='success'
                      size='sm'
                      onClick={handleExportCSV}
                      icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                    >
                      Download CSV
                    </Button>
                    <Button
                      variant='error'
                      size='sm'
                      onClick={handleExportPDF}
                      icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <CardContent>
                <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                  <table className='w-full min-w-[800px]'>
                    <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          DATE
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          DESCRIPTION
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          SOURCE
                        </th>
                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          AMOUNT (GHS)
                        </th>
                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                          RUNNING BALANCE
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={5}
                            className='px-6 py-4 text-center text-gray-500 dark:text-gray-400'
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : paginatedTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'
                          >
                            No transactions found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map(transaction => (
                          <tr
                            key={transaction.id}
                            className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200'
                          >
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {transaction.date}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {transaction.description}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap'>
                              {getSourceBadge(transaction.source)}
                            </td>
                            <td className='px-6 py-4 text-sm text-right whitespace-nowrap'>
                              <span
                                className={
                                  transaction.amount < 0
                                    ? 'text-error-600'
                                    : 'text-success-600 font-medium'
                                }
                              >
                                {transaction.amount < 0 ? '-' : '+'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 text-right whitespace-nowrap font-medium'>
                              {formatCurrency(transaction.runningBalance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='mt-6 flex justify-center'>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
