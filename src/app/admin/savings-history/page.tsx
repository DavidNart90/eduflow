'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Select,
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ArrowLeftIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context-optimized';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'momo' | 'controller' | 'interest' | 'deposit';
  amount: number;
  description: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method?: string;
  reference_id?: string;
  created_at: string;
  users: {
    full_name: string;
    employee_id: string;
    management_unit: string;
  };
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  mobileMoneyTotal: number;
  controllerTotal: number;
  interestTotal: number;
}

const ITEMS_PER_PAGE = 20;

export default function SavingsHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    transactionType: 'all',
    status: 'all',
    paymentMethod: 'all',
    dateRange: '30', // days
  });

  // Filter options
  const transactionTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'momo', label: 'Mobile Money' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'controller', label: 'Controller' },
    { value: 'interest', label: 'Interest' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ];

  const paymentMethodOptions = [
    { value: 'all', label: 'All Methods' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'controller', label: 'Controller' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
  ];

  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' },
    { value: 'all', label: 'All time' },
  ];

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: searchTerm,
        type: filters.transactionType,
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        dateRange: filters.dateRange,
      });

      const response = await fetch(`/api/admin/savings-history?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions);
      setSummary(data.summary);
      setTotalPages(Math.ceil(data.totalCount / ITEMS_PER_PAGE));
    } catch {
      // Error fetching transactions - could show user notification here
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'momo':
      case 'deposit':
        return CurrencyDollarIcon;
      case 'controller':
        return DocumentTextIcon;
      case 'interest':
        return BanknotesIcon;
      default:
        return CurrencyDollarIcon;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const config = {
      momo: { variant: 'primary' as const, label: 'Mobile Money' },
      deposit: { variant: 'primary' as const, label: 'Deposit' },
      controller: { variant: 'secondary' as const, label: 'Controller' },
      interest: { variant: 'success' as const, label: 'Interest' },
    };

    const { variant, label } = config[type as keyof typeof config] || {
      variant: 'default' as const,
      label: type,
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Fetch all transactions (not just current page) with same filters
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large number to get all results
        search: searchTerm,
        type: filters.transactionType,
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        dateRange: filters.dateRange,
      });

      const response = await fetch(`/api/admin/savings-history?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to fetch transactions for export'
        );
      }

      // Convert transactions to CSV
      const csvData = convertToCSV(data.transactions);

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `eduflow-transactions-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Error exporting CSV - could show user notification here
    } finally {
      setIsLoading(false);
    }
  };

  const convertToCSV = (data: Transaction[]) => {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    // Define headers
    const headers = [
      'Date',
      'Teacher Name',
      'Employee ID',
      'Management Unit',
      'Transaction Type',
      'Payment Method',
      'Amount (GHS)',
      'Description',
      'Status',
      'Reference ID',
      'Created At',
    ];

    // Convert data to CSV rows
    const rows = data.map(transaction => [
      transaction.transaction_date,
      `"${transaction.users.full_name}"`,
      transaction.users.employee_id,
      `"${transaction.users.management_unit}"`,
      transaction.transaction_type,
      transaction.payment_method || 'N/A',
      transaction.amount.toFixed(2),
      `"${transaction.description}"`,
      transaction.status,
      transaction.reference_id || 'N/A',
      transaction.created_at,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {/* Header */}
          <div className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
              <div className='flex items-center space-x-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => router.push('/admin/dashboard')}
                  icon={<ArrowLeftIcon className='h-4 w-4' />}
                  className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>

            <div>
              <h1 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                Savings & Transactions History
              </h1>
              <p className='text-slate-600 dark:text-slate-400 mt-1 md:mt-2 text-base md:text-lg'>
                Complete overview of all financial activities
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Total Amount
                      </p>
                      <h3 className='text-xl md:text-2xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(summary.totalAmount)}
                      </h3>
                    </div>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white'>
                      <ChartBarIcon className='h-5 w-5 md:h-6 md:w-6' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Total Transactions
                      </p>
                      <h3 className='text-xl md:text-2xl font-bold text-slate-900 dark:text-white'>
                        {summary.totalTransactions.toLocaleString()}
                      </h3>
                    </div>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white'>
                      <DocumentTextIcon className='h-5 w-5 md:h-6 md:w-6' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Mobile Money
                      </p>
                      <h3 className='text-xl md:text-2xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(summary.mobileMoneyTotal)}
                      </h3>
                    </div>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white'>
                      <CurrencyDollarIcon className='h-5 w-5 md:h-6 md:w-6' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardContent className='p-4 md:p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Controller Reports
                      </p>
                      <h3 className='text-xl md:text-2xl font-bold text-slate-900 dark:text-white'>
                        {formatCurrency(summary.controllerTotal)}
                      </h3>
                    </div>
                    <div className='p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white'>
                      <BanknotesIcon className='h-5 w-5 md:h-6 md:w-6' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card
            variant='glass'
            className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
          >
            <CardContent className='p-4 md:p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
                {/* Search */}
                <div className='lg:col-span-1'>
                  <div className='relative'>
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <input
                      type='text'
                      placeholder='Search by name or ID...'
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className='w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                {/* Transaction Type Filter */}
                <Select
                  value={filters.transactionType}
                  onChange={(value: string) =>
                    handleFilterChange('transactionType', value)
                  }
                  options={transactionTypeOptions}
                  placeholder='Transaction Type'
                />

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onChange={(value: string) =>
                    handleFilterChange('status', value)
                  }
                  options={statusOptions}
                  placeholder='Status'
                />

                {/* Payment Method Filter */}
                <Select
                  value={filters.paymentMethod}
                  onChange={(value: string) =>
                    handleFilterChange('paymentMethod', value)
                  }
                  options={paymentMethodOptions}
                  placeholder='Payment Method'
                />

                {/* Date Range Filter */}
                <Select
                  value={filters.dateRange}
                  onChange={(value: string) =>
                    handleFilterChange('dateRange', value)
                  }
                  options={dateRangeOptions}
                  placeholder='Date Range'
                />
              </div>

              <div className='flex justify-between items-center mt-4'>
                <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400'>
                  <FunnelIcon className='h-4 w-4' />
                  <span>
                    Showing {transactions.length} of{' '}
                    {summary?.totalTransactions || 0} transactions
                  </span>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  icon={<ArrowDownTrayIcon className='h-4 w-4' />}
                  className='text-slate-600 hover:hover:text-white dark:text-slate-400 dark:hover:text-white'
                  onClick={exportToCSV}
                  disabled={isLoading}
                >
                  {isLoading ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card
            variant='glass'
            className='border-white/20 bg-white/80 dark:bg-slate-800/80'
          >
            <CardHeader
              title='Transaction History'
              subtitle={`Page ${currentPage} of ${totalPages}`}
            />
            <CardContent>
              {isLoading ? (
                <div className='space-y-4'>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <MuiSkeletonComponent
                      key={index}
                      variant='rectangular'
                      height={80}
                      className='rounded-lg'
                    />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className='space-y-4'>
                  {transactions.map(transaction => {
                    const IconComponent = getTransactionIcon(
                      transaction.transaction_type
                    );
                    return (
                      <div
                        key={transaction.id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300'
                      >
                        <div className='flex items-center space-x-4 flex-1'>
                          <div className='flex-shrink-0'>
                            <div className='p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600'>
                              <IconComponent className='h-5 w-5 text-slate-600 dark:text-slate-300' />
                            </div>
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center space-x-2 mb-1'>
                              <h4 className='text-sm font-medium text-slate-900 dark:text-white truncate'>
                                {transaction.users.full_name}
                              </h4>
                              <span className='text-xs text-slate-500 dark:text-slate-400'>
                                ({transaction.users.employee_id})
                              </span>
                            </div>
                            <p className='text-sm text-slate-600 dark:text-slate-400 truncate'>
                              {transaction.description}
                            </p>
                            <div className='flex items-center space-x-2 mt-1'>
                              {getTransactionTypeBadge(
                                transaction.transaction_type
                              )}
                              {transaction.payment_method && (
                                <Badge variant='outline' className='text-xs'>
                                  {transaction.payment_method}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className='text-right flex-shrink-0'>
                            <div className='text-lg font-bold text-slate-900 dark:text-white'>
                              {formatCurrency(transaction.amount)}
                            </div>
                            <div className='text-xs text-slate-500 dark:text-slate-400'>
                              {formatDate(transaction.transaction_date)}
                            </div>
                            <div className='mt-1'>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-600'>
                      <div className='text-sm text-slate-600 dark:text-slate-400'>
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className='flex space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setCurrentPage(prev => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setCurrentPage(prev =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <DocumentTextIcon className='h-8 w-8 text-slate-400' />
                  </div>
                  <p className='text-slate-500 dark:text-slate-400 font-medium'>
                    No transactions found
                  </p>
                  <p className='text-sm text-slate-400 dark:text-slate-500 mt-1'>
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AdminRoute>
  );
}
