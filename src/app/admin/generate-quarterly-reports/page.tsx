'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Checkbox,
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface ReportData {
  id: string;
  name: string; // Could be teacher name or association name
  identifier: string; // Employee ID or Association ID
  reportMonth: string;
  type: 'teacher' | 'association';
  status: 'Generated' | 'Failed' | 'Processing';
  generatedDate: string;
}

interface GenerationHistory {
  id: string;
  period: string;
  reportCount: number;
  status: 'Completed' | 'Failed' | 'Partial';
  generatedBy: string;
  generatedDate: string;
}

export default function GenerateQuarterlyReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<
    'teacher' | 'association' | 'both'
  >('both');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [includeInterest, setIncludeInterest] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample data - replace with real data later
  const [reportsData] = useState<ReportData[]>([
    {
      id: '1',
      name: 'Sarah Mensah',
      identifier: 'TCH001234',
      reportMonth: 'December 2024',
      type: 'teacher',
      status: 'Generated',
      generatedDate: '2024-12-15',
    },
    {
      id: '2',
      name: 'John Asante',
      identifier: 'TCH001235',
      reportMonth: 'December 2024',
      type: 'teacher',
      status: 'Failed',
      generatedDate: '2024-12-15',
    },
    {
      id: '3',
      name: 'Mary Osei',
      identifier: 'TCH001236',
      reportMonth: 'December 2024',
      type: 'teacher',
      status: 'Generated',
      generatedDate: '2024-12-15',
    },
    {
      id: '4',
      name: 'Teachers Association of Ghana',
      identifier: 'ASSOC001',
      reportMonth: 'December 2024',
      type: 'association',
      status: 'Generated',
      generatedDate: '2024-12-15',
    },
    {
      id: '5',
      name: 'Educational Workers Union',
      identifier: 'ASSOC002',
      reportMonth: 'December 2024',
      type: 'association',
      status: 'Processing',
      generatedDate: '2024-12-15',
    },
  ]);

  const [generationHistory] = useState<GenerationHistory[]>([
    {
      id: '1',
      period: 'December 2024 reports generated',
      reportCount: 1247,
      status: 'Completed',
      generatedBy: 'Admin',
      generatedDate: '3 hours ago',
    },
    {
      id: '2',
      period: 'November 2024 reports generated',
      reportCount: 1240,
      status: 'Partial',
      generatedBy: 'Admin',
      generatedDate: '1 month ago',
    },
  ]);

  const reportTypes = [
    { value: 'both', label: 'Teacher & Association Reports' },
    { value: 'teacher', label: 'Teacher Reports Only' },
    { value: 'association', label: 'Association Reports Only' },
  ];

  const templateOptions = [
    { value: '', label: 'Use default templates...' },
    { value: 'classic', label: 'Classic Blue Template' },
    { value: 'modern', label: 'Modern Green Template' },
    { value: 'executive', label: 'Executive Template' },
  ];

  const years = [
    { value: '', label: 'Select year...' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
  ];

  const months = [
    { value: '', label: 'Select month...' },
    { value: 'january', label: 'January' },
    { value: 'february', label: 'February' },
    { value: 'march', label: 'March' },
    { value: 'april', label: 'April' },
    { value: 'may', label: 'May' },
    { value: 'june', label: 'June' },
    { value: 'july', label: 'July' },
    { value: 'august', label: 'August' },
    { value: 'september', label: 'September' },
    { value: 'october', label: 'October' },
    { value: 'november', label: 'November' },
    { value: 'december', label: 'December' },
  ];

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGenerateReports = () => {
    if (!selectedYear || !selectedMonth || !selectedReportType) {
      return;
    }

    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  // Filter reports based on selected type
  const filteredReports = reportsData.filter(report => {
    if (selectedReportType === 'both') return true;
    return report.type === selectedReportType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Generated':
        return (
          <Badge variant='success' className='text-xs'>
            Generated
          </Badge>
        );
      case 'Failed':
        return (
          <Badge variant='error' className='text-xs'>
            Failed
          </Badge>
        );
      case 'Processing':
        return (
          <Badge variant='warning' className='text-xs'>
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant='secondary' className='text-xs'>
            {status}
          </Badge>
        );
    }
  };

  const getHistoryStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant='success' className='text-xs'>
            Completed
          </Badge>
        );
      case 'Failed':
        return (
          <Badge variant='error' className='text-xs'>
            Failed
          </Badge>
        );
      case 'Partial':
        return (
          <Badge variant='warning' className='text-xs'>
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant='secondary' className='text-xs'>
            {status}
          </Badge>
        );
    }
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {isLoading ? (
            <>
              {/* Loading Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={400}
                      height={48}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-3 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={300}
                      height={24}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-2 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={400}
                      height={20}
                      animation='pulse'
                      className='mx-auto lg:mx-auto rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={80}
                    height={32}
                    animation='pulse'
                    className='self-start sm:self-auto rounded-full'
                  />
                </div>
              </div>

              {/* Loading Template Management */}
              <div className='max-w-6xl mx-auto mb-6'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={200}
                          height={24}
                          animation='pulse'
                          className='mb-2 rounded-lg'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={300}
                          height={16}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      </div>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={140}
                        height={40}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={80}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={80}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loading Configuration Card */}
              <div className='max-w-6xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-6 md:p-8'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={200}
                      height={24}
                      animation='pulse'
                      className='mb-6 rounded-lg'
                    />
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={60}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={60}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={60}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={60}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                    <div className='mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={150}
                        height={16}
                        animation='pulse'
                        className='mb-3 rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={200}
                        height={20}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={160}
                      height={48}
                      animation='pulse'
                      className='rounded-xl'
                    />
                  </CardContent>
                </Card>

                {/* Loading Reports Table */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={150}
                        height={24}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={120}
                        height={20}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>

                    {/* Table Headers */}
                    <div className='grid grid-cols-6 gap-4 mb-4'>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <MuiSkeletonComponent
                          key={i}
                          variant='rectangular'
                          width={'100%'}
                          height={20}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      ))}
                    </div>

                    {/* Table Rows */}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className='grid grid-cols-6 gap-4 mb-4'>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <MuiSkeletonComponent
                            key={j}
                            variant='rectangular'
                            width={'100%'}
                            height={24}
                            animation='pulse'
                            className='rounded-lg'
                          />
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Loading Bulk Actions */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={'100%'}
                    height={120}
                    animation='pulse'
                    className='rounded-xl'
                  />
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={'100%'}
                    height={120}
                    animation='pulse'
                    className='rounded-xl'
                  />
                </div>

                {/* Loading Generation History */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={150}
                        height={24}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={80}
                        height={20}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>

                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-4 mb-4'
                      >
                        <div className='flex items-center space-x-4'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={40}
                            height={40}
                            animation='pulse'
                            className='rounded-full'
                          />
                          <div>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={200}
                              height={16}
                              animation='pulse'
                              className='rounded-lg mb-2'
                            />
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={150}
                              height={14}
                              animation='pulse'
                              className='rounded-lg'
                            />
                          </div>
                        </div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={80}
                          height={24}
                          animation='pulse'
                          className='rounded-full'
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                      Generate Quarterly Reports
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                      Create and download PDF statements for teachers and
                      association summary
                    </p>
                  </div>
                  <Badge
                    variant='primary'
                    className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  >
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Main Content */}
              <div className='max-w-6xl mx-auto'>
                {/* Template Management */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-2 md:p-8'>
                    <div className='md:flex justify-between items-center mb-6 sm:block space-y-4'>
                      <div>
                        <h2 className='text-xl font-semibold text-slate-900 dark:text-white mb-2'>
                          Template Management
                        </h2>
                        <p className='text-sm text-slate-600 dark:text-slate-400'>
                          Design and customize report templates before
                          generating
                        </p>
                      </div>
                      <Button
                        variant='primary'
                        onClick={() =>
                          router.push(
                            '/admin/generate-quarterly-reports/preview'
                          )
                        }
                        className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        icon={<EyeIcon className='h-5 w-5' />}
                      >
                        Design Templates
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Teacher Templates */}
                      <div className='flex items-center space-x-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
                        <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center'>
                          <DocumentTextIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-medium text-blue-900 dark:text-blue-100'>
                            Teacher Templates
                          </h3>
                          <p className='text-sm text-blue-700 dark:text-blue-300'>
                            2 active templates
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            router.push(
                              '/admin/generate-quarterly-reports/preview'
                            )
                          }
                          className='!text-blue-600 hover:!bg-blue-100 dark:hover:!bg-blue-900/40'
                          icon={<PencilIcon className='h-4 w-4' />}
                        >
                          Edit
                        </Button>
                      </div>

                      {/* Association Templates */}
                      <div className='flex items-center space-x-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'>
                        <div className='w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center'>
                          <DocumentDuplicateIcon className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-medium text-purple-900 dark:text-purple-100'>
                            Association Templates
                          </h3>
                          <p className='text-sm text-purple-700 dark:text-purple-300'>
                            1 active template
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            router.push(
                              '/admin/generate-quarterly-reports/preview'
                            )
                          }
                          className='!text-purple-600 hover:!bg-purple-100 dark:hover:!bg-purple-900/40'
                          icon={<PencilIcon className='h-4 w-4' />}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Configuration */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-2 md:p-8'>
                    <h2 className='text-xl font-semibold text-slate-900 dark:text-white mb-6'>
                      Report Configuration
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
                      {/* Report Type Selection */}
                      <div>
                        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                          Report Type
                        </label>
                        <Select
                          value={selectedReportType}
                          onChange={value =>
                            setSelectedReportType(
                              value as 'teacher' | 'association' | 'both'
                            )
                          }
                          options={reportTypes}
                          className='w-full'
                        />
                      </div>

                      {/* Year Selection */}
                      <div>
                        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                          Year
                        </label>
                        <Select
                          value={selectedYear}
                          onChange={setSelectedYear}
                          options={years}
                          placeholder='Select year...'
                          className='w-full'
                        />
                      </div>

                      {/* Month Selection */}
                      <div>
                        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                          Month
                        </label>
                        <Select
                          value={selectedMonth}
                          onChange={setSelectedMonth}
                          options={months}
                          placeholder='Select month...'
                          className='w-full'
                        />
                      </div>

                      {/* Template Selection */}
                      <div>
                        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                          Template
                        </label>
                        <Select
                          value={selectedTemplate}
                          onChange={setSelectedTemplate}
                          options={templateOptions}
                          placeholder='Select template...'
                          className='w-full'
                        />
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className='mb-6'>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                        Additional Options
                      </label>
                      <div className='flex flex-wrap gap-4 '>
                        <Checkbox
                          checked={includeInterest}
                          onChange={e => setIncludeInterest(e.target.checked)}
                          label='Include Interest Calculations'
                          className='text-sm'
                        />
                      </div>
                    </div>

                    <div className='flex justify-start'>
                      <Button
                        variant='primary'
                        size='lg'
                        onClick={handleGenerateReports}
                        disabled={
                          !selectedYear ||
                          !selectedMonth ||
                          !selectedReportType ||
                          isGenerating
                        }
                        className='px-8 py-3 bg-gradient-to-r text-blue-500 dark:text-white from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                        icon={
                          isGenerating ? (
                            <ClockIcon className='h-5 w-5 animate-spin' />
                          ) : (
                            <ChartBarIcon className='h-5 w-5' />
                          )
                        }
                      >
                        {isGenerating
                          ? 'Generating Reports...'
                          : 'Generate Reports'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Generated Reports */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-2 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                        Generated Reports
                      </h2>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Last generated: December 2024
                      </p>
                    </div>

                    {/* Table */}
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-slate-200 dark:border-slate-700'>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              Name
                            </th>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              ID / Code
                            </th>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              Type
                            </th>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              Report Month
                            </th>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              Status
                            </th>
                            <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map(report => (
                            <tr
                              key={report.id}
                              className='border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            >
                              <td className='py-3 px-4 text-slate-900 dark:text-white'>
                                {report.name}
                              </td>
                              <td className='py-3 px-4 text-slate-600 dark:text-slate-400'>
                                {report.identifier}
                              </td>
                              <td className='py-3 px-4'>
                                <Badge
                                  variant={
                                    report.type === 'teacher'
                                      ? 'primary'
                                      : 'secondary'
                                  }
                                  className='text-xs capitalize'
                                >
                                  {report.type}
                                </Badge>
                              </td>
                              <td className='py-3 px-4 text-slate-600 dark:text-slate-400'>
                                {report.reportMonth}
                              </td>
                              <td className='py-3 px-4'>
                                {getStatusBadge(report.status)}
                              </td>
                              <td className='py-3 px-4'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  disabled={report.status !== 'Generated'}
                                  className='!text-primary hover:!text-primary/80'
                                  icon={
                                    <DocumentArrowDownIcon className='h-4 w-4' />
                                  }
                                >
                                  Download
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Actions */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  {/* Download All Reports */}
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <CardContent className='p-2 md:p-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                          <DocumentDuplicateIcon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-medium text-slate-900 dark:text-white'>
                            Download All Reports
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            Zip file with all PDFs
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='!text-blue-600 !border-blue-200 hover:!bg-blue-50'
                          icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                        >
                          Download ZIP
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Association Summary */}
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <CardContent className='p-2 md:p-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center'>
                          <DocumentTextIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-medium text-slate-900 dark:text-white'>
                            Association Summary
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            Quarterly reports
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='!text-purple-600 !border-purple-200 hover:!bg-purple-50'
                          icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                        >
                          Download Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Generation History */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-2 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                        Generation History
                      </h2>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='!text-primary hover:!text-primary/80'
                        icon={<EyeIcon className='h-4 w-4' />}
                      >
                        View All
                      </Button>
                    </div>

                    <div className='space-y-4'>
                      {generationHistory.map(history => (
                        <div
                          key={history.id}
                          className='flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors'
                        >
                          <div className='flex items-center space-x-4'>
                            <div className='w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                              <CheckCircleIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                            </div>
                            <div>
                              <p className='font-medium text-slate-900 dark:text-white'>
                                {history.period}
                              </p>
                              <p className='text-sm text-slate-600 dark:text-slate-400'>
                                {history.reportCount} reports • Generated by{' '}
                                {history.generatedBy} • {history.generatedDate}
                              </p>
                            </div>
                          </div>
                          {getHistoryStatusBadge(history.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6 mt-6'>
                  <Button
                    variant='ghost'
                    onClick={() => router.push('/admin/dashboard')}
                    className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    icon={<ArrowLeftIcon className='h-4 w-4' />}
                  >
                    Back to Dashboard
                  </Button>

                  <div className='flex space-x-4'>
                    <Button
                      variant='outline'
                      onClick={() =>
                        router.push('/admin/generate-quarterly-reports/preview')
                      }
                      className='text-primary dark:hover:bg-primary/10'
                    >
                      Preview Templates
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() =>
                        router.push('/admin/upload-controller-report')
                      }
                      className='text-primary dark:hover:bg-primary/10'
                    >
                      Upload Controller Report
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
}
