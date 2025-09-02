// Enhanced generate reports page that integrates with our backend
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth-context-optimized';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Checkbox,
} from '@/components/ui';
import { useReportGeneration, useTeachers } from '@/lib/reports/hooks';
import { formatDateForAPI, getQuarterDates } from '@/lib/reports/client';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function GenerateQuarterlyReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<
    'teacher' | 'association' | 'both'
  >('teacher'); // Default to teacher since it's working
  const [includeInterest, setIncludeInterest] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState<string[]>([]);
  const [successNotification, setSuccessNotification] = useState<string | null>(
    null
  );

  // Hooks for report generation
  const reportGeneration = useReportGeneration({
    onSuccess: result => {
      if (result.success) {
        // Show success notification instead of auto-downloading
        setSuccessNotification(
          result.message ||
            'Report generated successfully! You can view and download it from the "Generated Reports" page.'
        );
        // Auto-hide notification after 8 seconds
        setTimeout(() => setSuccessNotification(null), 8000);
      }
    },
    onError: () => {
      // Error handling is done via UI notification
    },
  });

  const { teachers, isLoading: teachersLoading, fetchTeachers } = useTeachers();

  // Load data on component mount
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const reportTypes = [
    { value: 'both', label: 'Teacher & Association Reports' },
    { value: 'teacher', label: 'Teacher Reports Only' },
    { value: 'association', label: 'Association Reports Only' },
  ];

  const years = [
    { value: '', label: 'Select year...' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
  ];

  const quarters = [
    { value: '', label: 'Select quarter...' },
    { value: '1', label: 'Q1 (Jan - Mar)' },
    { value: '2', label: 'Q2 (Apr - Jun)' },
    { value: '3', label: 'Q3 (Jul - Sep)' },
    { value: '4', label: 'Q4 (Oct - Dec)' },
  ];

  const handleGenerateReports = async () => {
    // Clear any existing errors and notifications
    setShowErrors([]);
    setSuccessNotification(null);

    if (!selectedYear || !selectedQuarter || !selectedReportType) {
      reportGeneration.clearError();
      setShowErrors([
        'Please select year, quarter, and report type before generating reports.',
      ]);
      return;
    }

    if (
      (selectedReportType === 'teacher' || selectedReportType === 'both') &&
      selectedTeachers.length === 0
    ) {
      reportGeneration.clearError();
      setShowErrors([
        'Please select at least one teacher for teacher reports.',
      ]);
      return;
    }

    const { startDate, endDate } = getQuarterDates(
      parseInt(selectedYear),
      parseInt(selectedQuarter)
    );

    try {
      if (selectedReportType === 'teacher' || selectedReportType === 'both') {
        // Generate reports for each selected teacher
        for (const teacherId of selectedTeachers) {
          await reportGeneration.generateTeacherStatement(teacherId, {
            startDate: formatDateForAPI(startDate),
            endDate: formatDateForAPI(endDate),
            generatedBy: user?.employee_id || user?.email || 'admin',
          });
        }
      }

      if (
        selectedReportType === 'association' ||
        selectedReportType === 'both'
      ) {
        await reportGeneration.generateAssociationSummary({
          startDate: formatDateForAPI(startDate),
          endDate: formatDateForAPI(endDate),
          generatedBy: user?.employee_id || user?.email || 'admin',
        });
      }
    } catch (error) {
      // Error handling is done via the hook's onError callback
      setShowErrors([
        error instanceof Error
          ? error.message
          : 'Report generation failed. Please try again.',
      ]);
    }
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
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
            {/* Success Notification */}
            {successNotification && (
              <Card
                variant='glass'
                className='border-green-200 bg-green-50 dark:bg-green-900/20 mb-6'
              >
                <CardContent className='p-4'>
                  <div className='flex items-start space-x-3'>
                    <CheckCircleIcon className='h-5 w-5 text-green-600 mt-0.5' />
                    <div className='flex-1'>
                      <p className='text-green-700 dark:text-green-300'>
                        {successNotification}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => router.push('/admin/generated-reports')}
                        className='mt-2 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-900/30'
                      >
                        View Generated Reports
                      </Button>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSuccessNotification(null)}
                      className='text-green-600 hover:text-green-700'
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Error Display */}
            {showErrors.length > 0 && (
              <Card
                variant='glass'
                className='border-red-200 bg-red-50 dark:bg-red-900/20 mb-6'
              >
                <CardContent className='p-4'>
                  <div className='flex items-start space-x-3'>
                    <ExclamationTriangleIcon className='h-5 w-5 text-red-600 mt-0.5' />
                    <div className='flex-1'>
                      {showErrors.map((error, index) => (
                        <p
                          key={index}
                          className='text-red-700 dark:text-red-300 mb-1'
                        >
                          {error}
                        </p>
                      ))}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowErrors([])}
                      className='text-red-600 hover:text-red-700'
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Error Display */}
            {reportGeneration.error && (
              <Card
                variant='glass'
                className='border-red-200 bg-red-50 dark:bg-red-900/20 mb-6'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    <ExclamationTriangleIcon className='h-5 w-5 text-red-600' />
                    <p className='text-red-700 dark:text-red-300'>
                      {reportGeneration.error}
                    </p>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={reportGeneration.clearError}
                      className='text-red-600 hover:text-red-700'
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <p className='text-slate-600 dark:text-slate-400'>
                      Customize report templates or use defaults
                    </p>
                  </div>
                  <Button
                    variant='primary'
                    onClick={() => router.push('/admin/dashboard')}
                    className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    icon={<ChartBarIcon className='h-5 w-5' />}
                  >
                    View Dashboard
                  </Button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='flex items-center space-x-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
                    <DocumentTextIcon className='h-8 w-8 text-blue-600' />
                    <div>
                      <h3 className='font-medium text-slate-900 dark:text-white'>
                        Teacher Reports
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Individual financial statements
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'>
                    <DocumentTextIcon className='h-8 w-8 text-purple-600' />
                    <div>
                      <h3 className='font-medium text-slate-900 dark:text-white'>
                        Association Reports
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Quarterly summary reports
                      </p>
                    </div>
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
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
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

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
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

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Quarter
                    </label>
                    <Select
                      value={selectedQuarter}
                      onChange={setSelectedQuarter}
                      options={quarters}
                      placeholder='Select quarter...'
                      className='w-full'
                    />
                  </div>
                </div>

                {/* Teacher Selection */}
                {(selectedReportType === 'teacher' ||
                  selectedReportType === 'both') && (
                  <div className='mb-6'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                      Select Teachers ({selectedTeachers.length} selected)
                    </label>
                    <div className='max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-4'>
                      {teachersLoading ? (
                        <p className='text-slate-500'>Loading teachers...</p>
                      ) : teachers.length === 0 ? (
                        <p className='text-slate-500'>
                          No teachers found. Please add teachers first.
                        </p>
                      ) : (
                        <div className='space-y-2'>
                          <div className='mb-2'>
                            <Checkbox
                              checked={
                                selectedTeachers.length === teachers.length &&
                                teachers.length > 0
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTeachers(
                                    teachers.map(t => t.user_id)
                                  );
                                } else {
                                  setSelectedTeachers([]);
                                }
                              }}
                              label='Select All Teachers'
                              className='font-medium'
                            />
                          </div>
                          {teachers.map(teacher => (
                            <Checkbox
                              key={teacher.user_id}
                              checked={selectedTeachers.includes(
                                teacher.user_id
                              )}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTeachers(prev => [
                                    ...prev,
                                    teacher.user_id,
                                  ]);
                                } else {
                                  setSelectedTeachers(prev =>
                                    prev.filter(id => id !== teacher.user_id)
                                  );
                                }
                              }}
                              label={`${teacher.full_name} (${teacher.employee_id})`}
                              className='text-sm'
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                    Additional Options
                  </label>
                  <div className='flex flex-wrap gap-4'>
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
                      !selectedQuarter ||
                      !selectedReportType ||
                      reportGeneration.isGenerating ||
                      ((selectedReportType === 'teacher' ||
                        selectedReportType === 'both') &&
                        selectedTeachers.length === 0)
                    }
                    className='px-8 py-3 text-primary-500 dark:text-white bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed'
                    icon={
                      reportGeneration.isGenerating ? (
                        <ClockIcon className='h-5 w-5 animate-spin' />
                      ) : (
                        <ChartBarIcon className='h-5 w-5' />
                      )
                    }
                  >
                    {reportGeneration.isGenerating
                      ? 'Generating Reports...'
                      : 'Generate Reports'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            {reportGeneration.lastResult?.success && (
              <Card
                variant='glass'
                className='border-green-200 bg-green-50 dark:bg-green-900/20 mb-6'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    <CheckCircleIcon className='h-5 w-5 text-green-600' />
                    <div>
                      <p className='text-green-700 dark:text-green-300 font-medium'>
                        Report generated successfully!
                      </p>
                      {reportGeneration.lastResult.file_name && (
                        <p className='text-green-600 dark:text-green-400 text-sm'>
                          File: {reportGeneration.lastResult.file_name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  onClick={() => router.push('/admin/upload-controller-report')}
                  className='text-primary dark:hover:bg-primary/10'
                >
                  Upload Controller Report
                </Button>
                <Button
                  variant='outline'
                  onClick={() => router.push('/admin/savings-history')}
                  className='text-primary dark:hover:bg-primary/10'
                >
                  View All Transactions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
