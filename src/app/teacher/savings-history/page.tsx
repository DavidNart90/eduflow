'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-optimized';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Pagination,
  Input,
  Select,
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
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

  useEffect(() => {
    const fetchSavingsHistory = () => {
      try {
        setLoading(true);

        // For now, using mock data
        // In production, replace with actual API call
        setTimeout(() => {
          setData(mockData);
          setLoading(false);
        }, 3000);

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

              {/* Summary Cards Skeleton */}
              <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8'>
                {Array.from({ length: 4 }).map((_, index) => (
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
                          width={120}
                          height={20}
                          animation='pulse'
                          className='rounded-md'
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Loading Transaction History Card */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                padding='lg'
              >
                <CardContent className='p-4 md:p-8'>
                  {/* Loading Card Header */}
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

                  {/* Loading Filters */}
                  <div className='mb-6 space-y-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6'>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i}>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={'80%'}
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
                  </div>

                  {/* Loading Table */}
                  <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                    <table className='w-full min-w-[800px]'>
                      <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                        <tr>
                          {[
                            'DATE',
                            'DESCRIPTION',
                            'SOURCE',
                            'AMOUNT',
                            'BALANCE',
                          ].map(header => (
                            <th key={header} className='px-6 py-3'>
                              <MuiSkeletonComponent
                                variant='rectangular'
                                width={'80%'}
                                height={16}
                                animation='pulse'
                                className='rounded'
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                        {[1, 2, 3, 4, 5].map(i => (
                          <tr key={i}>
                            {[1, 2, 3, 4, 5].map(j => (
                              <td key={j} className='px-6 py-4'>
                                <MuiSkeletonComponent
                                  variant='rectangular'
                                  width={j === 3 ? '60%' : '80%'}
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
          <div className='mx-auto max-w-8xl space-y-6'>
            {/* Header */}
            <div className='mb-6 md:mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='lg:w-full'>
                  <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                    Savings History & Analytics
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                    Complete Transaction Record
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                    Track all your contributions, withdrawals, and interest
                    earnings
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

            {/* Summary Cards */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80  hover:shadow-xl'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                        <CurrencyDollarIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Total Savings Balance
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent truncate'>
                        {data && formatCurrency(data.totalBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                        <PhoneIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        MoMo Contributions
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent truncate'>
                        {data && formatCurrency(data.totalMomoContributions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80  hover:shadow-xl'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
                        <UserIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Controller Deductions
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent truncate'>
                        {data &&
                          formatCurrency(data.totalControllerContributions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80  hover:shadow-xl'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
                        <ChartBarIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Interest Earned
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent truncate'>
                        {data && formatCurrency(data.interestEarned)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Transaction History */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 shadow-xl'
              padding='lg'
            >
              <div className='space-y-2 mb-6'>
                <h2 className='text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                  Transaction History & Analytics
                </h2>
                <p className='text-slate-600 dark:text-slate-400 text-sm md:text-base'>
                  Complete record of all your savings activities with advanced
                  filtering
                </p>
              </div>

              {/* Filters */}
              <div className='mb-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border border-slate-200/50 dark:border-slate-700/50'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center'>
                  <FunnelIcon className='h-5 w-5 mr-2 text-primary' />
                  Filter Transactions
                </h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
                  <div className='lg:col-span-1'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Start Date
                    </label>
                    <Input
                      type='date'
                      value={filters.startDate}
                      onChange={e =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                      variant='filled'
                    />
                  </div>

                  <div className='lg:col-span-1'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      End Date
                    </label>
                    <Input
                      type='date'
                      value={filters.endDate}
                      onChange={e =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                      variant='filled'
                    />
                  </div>

                  <div className='lg:col-span-1'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
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
                        { value: 'all', label: 'All Sources' },
                        { value: 'momo', label: 'Mobile Money' },
                        { value: 'controller', label: 'Controller Deduction' },
                        { value: 'interest', label: 'Interest Payment' },
                        { value: 'withdrawal', label: 'Withdrawal' },
                      ]}
                      variant='filled'
                    />
                  </div>

                  <div className='lg:col-span-2'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Search Transactions
                    </label>
                    <Input
                      type='text'
                      placeholder='Search by description or reference...'
                      value={filters.search}
                      onChange={e =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      leftIcon={<MagnifyingGlassIcon className='h-4 w-4' />}
                      variant='filled'
                    />
                  </div>

                  <div className='lg:col-span-1 flex flex-col justify-end space-y-2'>
                    <Button
                      variant='primary'
                      onClick={handleApplyFilters}
                      icon={<FunnelIcon className='h-4 w-4' />}
                      className='w-full'
                      size='md'
                    >
                      Apply Filters
                    </Button>
                    <div className='flex space-x-2'>
                      <Button
                        variant='success'
                        size='sm'
                        onClick={handleExportCSV}
                        icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                        className='flex-1'
                      >
                        CSV
                      </Button>
                      <Button
                        variant='error'
                        size='sm'
                        onClick={handleExportPDF}
                        icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                        className='flex-1'
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <CardContent>
                <div className='overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'>
                  <table className='w-full min-w-[800px]'>
                    <thead className='bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700'>
                      <tr>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Date
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Description
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Source
                        </th>
                        <th className='px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Amount (GHS)
                        </th>
                        <th className='px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                          Running Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={5}
                            className='px-6 py-8 text-center text-slate-500 dark:text-slate-400'
                          >
                            <div className='flex items-center justify-center space-x-2'>
                              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary'></div>
                              <span>Loading transactions...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className='px-6 py-12 text-center'>
                            <div className='flex flex-col items-center space-y-3'>
                              <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center'>
                                <DocumentArrowDownIcon className='h-8 w-8 text-slate-400' />
                              </div>
                              <div className='text-center'>
                                <p className='text-lg font-medium text-slate-900 dark:text-slate-100'>
                                  No transactions found
                                </p>
                                <p className='text-slate-500 dark:text-slate-400'>
                                  Try adjusting your filters or search criteria
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                              index % 2 === 0
                                ? 'bg-white dark:bg-slate-900/50'
                                : 'bg-slate-50/50 dark:bg-slate-800/25'
                            }`}
                          >
                            <td className='px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap'>
                              {transaction.date}
                            </td>
                            <td className='px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap'>
                              {transaction.description}
                            </td>
                            <td className='px-6 py-4 text-sm whitespace-nowrap'>
                              {getSourceBadge(transaction.source)}
                            </td>
                            <td className='px-6 py-4 text-sm text-right whitespace-nowrap font-semibold'>
                              <span
                                className={
                                  transaction.amount < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                }
                              >
                                {transaction.amount < 0 ? '-' : '+'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className='px-6 py-4 text-sm text-slate-900 dark:text-slate-100 text-right whitespace-nowrap font-bold'>
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
                  <div className='mt-8 flex justify-center'>
                    <div className='bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700'>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
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
