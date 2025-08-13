'use client';

import { useState } from 'react';

import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [emailType, setEmailType] = useState('All Types');
  const [status, setStatus] = useState('All Status');

  const emailLogs: EmailLog[] = [
    {
      id: '1',
      dateSent: 'Jul 28, 2025, 10:15 AM',
      recipientName: 'Sarah Mensah',
      recipientEmail: 'sarah.mensah@gmail.com',
      type: 'Statement Sent',
      subject: 'Your June Statement is Ready',
      status: 'Sent',
    },
    {
      id: '2',
      dateSent: 'Jul 27, 2025, 03:22 PM',
      recipientName: 'John Asante',
      recipientEmail: 'john.asante@gmail.com',
      type: 'MoMo Deposit',
      subject: 'Your savings deposit of GHS 200 has been confirmed',
      status: 'Failed',
    },
    {
      id: '3',
      dateSent: 'Jul 26, 2025, 11:45 AM',
      recipientName: 'Mary Osei',
      recipientEmail: 'mary.osei@gmail.com',
      type: 'Interest Paid',
      subject: 'Q2 2025 Interest Payment Applied - GHS 45.50',
      status: 'Sent',
    },
    {
      id: '4',
      dateSent: 'Jul 25, 2025, 02:18 PM',
      recipientName: 'Kwame Frimpong',
      recipientEmail: 'kwame.frimpong@gmail.com',
      type: 'Account Invite',
      subject: 'Welcome to EduFlow - Complete Your Account Setup',
      status: 'Pending',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Statement Sent':
        return <EnvelopeIcon className='h-4 w-4' />;
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
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
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

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
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

  return (
    <AdminRoute>
      <Layout>
        <div className='p-6'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
              Email Notification Log
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>
              Track and manage all email notifications sent through the system
            </p>
          </div>

          {/* Search and Filters */}
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-end'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Search
                  </label>
                  <Input
                    placeholder='Search by email, name, or subject'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className='h-5 w-5' />}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Status
                  </label>
                  <Select
                    value={status}
                    onChange={value => setStatus(value)}
                    options={[
                      { value: 'All Status', label: 'All Status' },
                      { value: 'Sent', label: 'Sent' },
                      { value: 'Failed', label: 'Failed' },
                      { value: 'Pending', label: 'Pending' },
                    ]}
                  />
                </div>

                <div>
                  <Button variant='primary' className='w-full'>
                    Apply Filters
                  </Button>
                </div>
              </div>

              <div className='mt-4'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Date Range
                </label>
                <div className='flex items-center space-x-2'>
                  <Input
                    type='date'
                    placeholder='dd/mm/yyyy'
                    className='flex-1'
                  />
                  <span className='text-gray-500'>to</span>
                  <Input
                    type='date'
                    placeholder='dd/mm/yyyy'
                    className='flex-1'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Log Table */}
          <Card>
            <CardHeader
              title='Email Notification Log'
              subtitle='Track and manage all email notifications sent through the system'
            />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Date Sent
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Recipient Name
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Email Address
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Type
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Subject Line
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Status
                      </th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.map(log => (
                      <tr
                        key={log.id}
                        className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                      >
                        <td className='py-4 px-4 text-sm text-gray-600 dark:text-gray-400'>
                          {log.dateSent}
                        </td>
                        <td className='py-4 px-4'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
                              <span className='text-white text-xs font-medium'>
                                {getInitials(log.recipientName)}
                              </span>
                            </div>
                            <span className='text-sm font-medium text-gray-900 dark:text-white'>
                              {log.recipientName}
                            </span>
                          </div>
                        </td>
                        <td className='py-4 px-4 text-sm text-gray-600 dark:text-gray-400'>
                          {log.recipientEmail}
                        </td>
                        <td className='py-4 px-4'>
                          <div className='flex items-center space-x-2'>
                            {getTypeBadge(log.type)}
                            {getTypeIcon(log.type)}
                          </div>
                        </td>
                        <td className='py-4 px-4 text-sm text-gray-900 dark:text-white'>
                          {log.subject}
                        </td>
                        <td className='py-4 px-4'>
                          {getStatusBadge(log.status)}
                        </td>
                        <td className='py-4 px-4'>
                          <div className='flex items-center space-x-2'>
                            <Button variant='ghost' size='sm'>
                              <EyeIcon className='h-4 w-4' />
                            </Button>
                            {log.status === 'Failed' && (
                              <Button variant='ghost' size='sm'>
                                <ArrowPathIcon className='h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className='mt-6 flex items-center justify-between'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Showing 1 to 4 of 1,247 email logs
                </p>
                <div className='flex items-center space-x-2'>
                  <Button variant='ghost' size='sm'>
                    ←
                  </Button>
                  <Button variant='primary' size='sm'>
                    1
                  </Button>
                  <Button variant='ghost' size='sm'>
                    2
                  </Button>
                  <Button variant='ghost' size='sm'>
                    3
                  </Button>
                  <Button variant='ghost' size='sm'>
                    →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AdminRoute>
  );
}
