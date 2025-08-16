'use client';

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Pagination,
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface EmailLog {
  id: string;
  dateSent: string;
  recipientName: string;
  recipientEmail: string;
  type: string;
  subject: string;
  status: string;
  profilePicture?: string;
}

export default function EmailLogPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailType, setEmailType] = useState('All Types');
  const [status, setStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const emailLogs: EmailLog[] = [
    {
      id: '1',
      dateSent: 'Aug 15, 2025, 10:15 AM',
      recipientName: 'Sarah Mensah',
      recipientEmail: 'sarah.mensah@education.gov.gh',
      type: 'Statement Sent',
      subject: 'Your July Statement is Ready - EduFlow Savings',
      status: 'Sent',
    },
    {
      id: '2',
      dateSent: 'Aug 14, 2025, 03:22 PM',
      recipientName: 'John Asante',
      recipientEmail: 'john.asante@gmail.com',
      type: 'MoMo Deposit',
      subject: 'Savings deposit confirmation - GHS 200.00',
      status: 'Failed',
    },
    {
      id: '3',
      dateSent: 'Aug 13, 2025, 11:45 AM',
      recipientName: 'Mary Osei',
      recipientEmail: 'mary.osei@education.gov.gh',
      type: 'Interest Paid',
      subject: 'Q3 2025 Interest Payment Applied - GHS 87.50',
      status: 'Sent',
    },
    {
      id: '4',
      dateSent: 'Aug 12, 2025, 02:18 PM',
      recipientName: 'Kwame Frimpong',
      recipientEmail: 'kwame.frimpong@education.gov.gh',
      type: 'Account Invite',
      subject: 'Welcome to EduFlow - Complete Your Account Setup',
      status: 'Pending',
    },
    {
      id: '5',
      dateSent: 'Aug 11, 2025, 09:30 AM',
      recipientName: 'Akosua Darko',
      recipientEmail: 'akosua.darko@education.gov.gh',
      type: 'Statement Sent',
      subject: 'Your July Statement is Ready - EduFlow Savings',
      status: 'Sent',
    },
    {
      id: '6',
      dateSent: 'Aug 10, 2025, 04:45 PM',
      recipientName: 'Emmanuel Owusu',
      recipientEmail: 'emmanuel.owusu@gmail.com',
      type: 'MoMo Deposit',
      subject: 'Savings deposit confirmation - GHS 150.00',
      status: 'Sent',
    },
  ];

  // Simulate loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Statement Sent':
        return <DocumentArrowDownIcon className='h-4 w-4' />;
      case 'MoMo Deposit':
        return <PhoneIcon className='h-4 w-4' />;
      case 'Interest Paid':
        return <CurrencyDollarIcon className='h-4 w-4' />;
      case 'Account Invite':
        return <UserPlusIcon className='h-4 w-4' />;
      default:
        return <EnvelopeIcon className='h-4 w-4' />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      'Statement Sent': 'primary',
      'MoMo Deposit': 'success',
      'Interest Paid': 'warning',
      'Account Invite': 'secondary',
    } as const;

    return (
      <Badge
        variant={variants[type as keyof typeof variants] || 'secondary'}
        icon={getTypeIcon(type)}
        iconPosition='left'
        size='sm'
      >
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Sent: 'success',
      Failed: 'error',
      Pending: 'warning',
    } as const;

    const icons = {
      Sent: <CheckCircleIcon className='h-3 w-3' />,
      Failed: <XCircleIcon className='h-3 w-3' />,
      Pending: <ClockIcon className='h-3 w-3' />,
    };

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || 'secondary'}
        icon={icons[status as keyof typeof icons]}
        iconPosition='left'
        size='sm'
      >
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEmailStats = () => {
    const total = emailLogs.length;
    const sent = emailLogs.filter(log => log.status === 'Sent').length;
    const failed = emailLogs.filter(log => log.status === 'Failed').length;
    const pending = emailLogs.filter(log => log.status === 'Pending').length;

    return { total, sent, failed, pending };
  };

  const stats = getEmailStats();
  const totalPages = Math.ceil(emailLogs.length / itemsPerPage);
  const paginatedLogs = emailLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <AdminRoute>
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
                      width={320}
                      height={40}
                      animation='pulse'
                      className='rounded-lg mb-3'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={420}
                      height={20}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={100}
                    height={32}
                    animation='pulse'
                    className='rounded-full'
                  />
                </div>
              </div>

              {/* Stats Cards Skeleton */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={index}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-4'>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={48}
                          height={48}
                          animation='pulse'
                          className='rounded-full'
                        />
                        <div className='flex-1'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={120}
                            height={16}
                            animation='pulse'
                            className='rounded mb-2'
                          />
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={60}
                            height={24}
                            animation='pulse'
                            className='rounded'
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Filters Skeleton */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
              >
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={80}
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
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={100}
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

              {/* Table Skeleton */}
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80'
              >
                <CardContent className='p-6'>
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

                  <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                    <table className='w-full min-w-[1000px]'>
                      <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                        <tr>
                          {[
                            'Date',
                            'Recipient',
                            'Email',
                            'Type',
                            'Subject',
                            'Status',
                            'Actions',
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
                            {[1, 2, 3, 4, 5, 6, 7].map(j => (
                              <td key={j} className='px-6 py-4'>
                                <MuiSkeletonComponent
                                  variant='rectangular'
                                  width={
                                    j === 2
                                      ? '120px'
                                      : j === 5
                                        ? '200px'
                                        : '80%'
                                  }
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
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Layout>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 p-4 md:p-6'>
          <div className='mx-auto max-w-8xl space-y-6'>
            {/* Header */}
            <div className='mb-6 md:mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='lg:w-full'>
                  <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                    Email Notification System
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                    Advanced Communication Management
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                    Track, monitor, and manage all system email notifications
                    and communications
                  </p>
                </div>
                <Badge
                  variant='warning'
                  className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  icon={<InboxIcon className='h-4 w-4' />}
                >
                  Email Logs
                </Badge>
              </div>
            </div>

            {/* Email Statistics Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                        <InboxIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Total Emails
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
                        <CheckCircleIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Successfully Sent
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                        {stats.sent}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg'>
                        <XCircleIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Failed Delivery
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                        {stats.failed}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant='glass'
                className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg'>
                        <ClockIcon className='h-6 w-6' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
                        Pending Queue
                      </p>
                      <p className='text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                        {stats.pending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Search and Filters */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 shadow-xl'
            >
              <CardContent className='p-6'>
                <div className='flex items-center space-x-3 mb-6'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white'>
                    <FunnelIcon className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                      Advanced Email Filters
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      Search and filter email notifications by various criteria
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Search Communications
                    </label>
                    <Input
                      placeholder='Search by email, name, or subject'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      leftIcon={<MagnifyingGlassIcon className='h-5 w-5' />}
                      variant='filled'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Email Type
                    </label>
                    <Select
                      value={emailType}
                      onChange={value => setEmailType(value)}
                      options={[
                        { value: 'All Types', label: 'All Types' },
                        { value: 'Statement Sent', label: 'Statement Sent' },
                        { value: 'MoMo Deposit', label: 'MoMo Deposit' },
                        { value: 'Interest Paid', label: 'Interest Paid' },
                        { value: 'Account Invite', label: 'Account Invite' },
                      ]}
                      variant='filled'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Delivery Status
                    </label>
                    <Select
                      value={status}
                      onChange={value => setStatus(value)}
                      options={[
                        { value: 'All Status', label: 'All Status' },
                        { value: 'Sent', label: 'Successfully Sent' },
                        { value: 'Failed', label: 'Delivery Failed' },
                        { value: 'Pending', label: 'Pending Queue' },
                      ]}
                      variant='filled'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Actions
                    </label>
                    <div className='flex space-x-2'>
                      <Button variant='primary' className='flex-1' size='md'>
                        Apply Filters
                      </Button>
                      <Button variant='outline' size='md'>
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Start Date
                    </label>
                    <Input
                      type='date'
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                      variant='filled'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      End Date
                    </label>
                    <Input
                      type='date'
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      leftIcon={<CalendarIcon className='h-4 w-4' />}
                      variant='filled'
                    />
                  </div>

                  <div className='flex items-end'>
                    <Button
                      variant='success'
                      size='md'
                      className='w-full'
                      icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                    >
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Log Table */}
            <Card
              variant='glass'
              className='border-white/20 bg-white/80 dark:bg-slate-800/80 shadow-xl'
            >
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent'>
                      Email Communication Log
                    </h3>
                    <p className='text-slate-600 dark:text-slate-400 text-sm'>
                      Complete history of all system email notifications
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge variant='secondary' className='px-3 py-1'>
                      {emailLogs.length} records
                    </Badge>
                    <Button
                      variant='outline'
                      size='sm'
                      icon={<ArrowPathIcon className='h-4 w-4' />}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className='overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'>
                  <table className='w-full min-w-[1200px] lg:min-w-full'>
                    <thead className='bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700'>
                      <tr>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32 sm:w-auto'>
                          Date & Time
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32 sm:w-auto'>
                          Recipient
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-48 sm:w-auto'>
                          Email Address
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-28 sm:w-auto'>
                          Type
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-64 sm:w-auto'>
                          Subject Line
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-24 sm:w-auto'>
                          Status
                        </th>
                        <th className='px-4 sm:px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-24 sm:w-auto'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                      {paginatedLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className='px-6 py-12 text-center'>
                            <div className='flex flex-col items-center space-y-3'>
                              <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center'>
                                <InboxIcon className='h-8 w-8 text-slate-400' />
                              </div>
                              <div className='text-center'>
                                <p className='text-lg font-medium text-slate-900 dark:text-slate-100'>
                                  No email logs found
                                </p>
                                <p className='text-slate-500 dark:text-slate-400'>
                                  Try adjusting your filters or date range
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedLogs.map((log, index) => (
                          <tr
                            key={log.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                              index % 2 === 0
                                ? 'bg-white dark:bg-slate-900/50'
                                : 'bg-slate-50/50 dark:bg-slate-800/25'
                            }`}
                          >
                            <td className='px-4 sm:px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap'>
                              <div className='min-w-[120px]'>
                                {log.dateSent}
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4'>
                              <div className='flex items-center space-x-3 min-w-[140px]'>
                                <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0'>
                                  <span className='text-white text-xs font-bold'>
                                    {getInitials(log.recipientName)}
                                  </span>
                                </div>
                                <div className='min-w-0'>
                                  <p className='text-sm font-medium text-slate-900 dark:text-white truncate'>
                                    {log.recipientName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400'>
                              <div className='min-w-[200px] max-w-[250px] truncate'>
                                {log.recipientEmail}
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4'>
                              <div className='min-w-[100px]'>
                                {getTypeBadge(log.type)}
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4 text-sm text-slate-900 dark:text-white'>
                              <div className='min-w-[250px] max-w-[300px] truncate'>
                                {log.subject}
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4'>
                              <div className='min-w-[80px]'>
                                {getStatusBadge(log.status)}
                              </div>
                            </td>
                            <td className='px-4 sm:px-6 py-4'>
                              <div className='flex items-center justify-center space-x-1 sm:space-x-2 min-w-[120px]'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm'
                                  icon={
                                    <EyeIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                                  }
                                >
                                  <span className='hidden sm:inline'>View</span>
                                </Button>
                                {log.status === 'Failed' && (
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs sm:text-sm'
                                    icon={
                                      <ArrowPathIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                                    }
                                  >
                                    <span className='hidden sm:inline'>
                                      Retry
                                    </span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className='mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0'>
                    <div className='text-sm text-slate-600 dark:text-slate-400'>
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, emailLogs.length)}{' '}
                      of {emailLogs.length} email logs
                    </div>
                    <div className='bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-slate-200 dark:border-slate-700'>
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
    </AdminRoute>
  );
}
