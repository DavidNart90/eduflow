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
import {
  useReportGeneration,
  useTemplates,
  useTeachers,
} from '@/lib/reports/hooks';
import { formatDateForAPI, getMonthDates } from '@/lib/reports/client';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function GenerateQuarterlyReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<
    'teacher' | 'association' | 'both'
  >('both');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [includeInterest, setIncludeInterest] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState<string[]>([]);

  // Hooks for report generation
  const reportGeneration = useReportGeneration({
    onSuccess: result => {
      if (result.file_url) {
        // Automatically download the generated report
        const link = document.createElement('a');
        link.href = result.file_url;
        link.download = result.file_name || 'report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: () => {
      // Error handling is done via UI notification
    },
  });

  const {
    templates,
    isLoading: templatesLoading,
    fetchTemplates,
  } = useTemplates();
  const { teachers, isLoading: teachersLoading, fetchTeachers } = useTeachers();

  // Load data on component mount
  useEffect(() => {
    fetchTemplates();
    fetchTeachers();
  }, [fetchTemplates, fetchTeachers]);

  const reportTypes = [
    { value: 'both', label: 'Teacher & Association Reports' },
    { value: 'teacher', label: 'Teacher Reports Only' },
    { value: 'association', label: 'Association Reports Only' },
  ];

  const templateOptions = [
    { value: '', label: 'Use default templates...' },
    ...templates
      .filter(
        t => selectedReportType === 'both' || t.type === selectedReportType
      )
      .map(t => ({
        value: t.id,
        label: t.name,
      })),
  ];

  const years = [
    { value: '', label: 'Select year...' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
  ];

  const months = [
    { value: '', label: 'Select month...' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const handleGenerateReports = async () => {
    // Clear any existing errors
    setShowErrors([]);

    if (!selectedYear || !selectedMonth || !selectedReportType) {
      reportGeneration.clearError();
      setShowErrors([
        'Please select year, month, and report type before generating reports.',
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

    const { startDate, endDate } = getMonthDates(
      parseInt(selectedYear),
      parseInt(selectedMonth)
    );

    try {
      if (selectedReportType === 'teacher' || selectedReportType === 'both') {
        // Generate reports for each selected teacher
        for (const teacherId of selectedTeachers) {
          await reportGeneration.generateTeacherStatement(teacherId, {
            startDate: formatDateForAPI(startDate),
            endDate: formatDateForAPI(endDate),
            templateId: selectedTemplate || undefined,
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
          templateId: selectedTemplate || undefined,
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
                    onClick={() =>
                      router.push('/admin/generate-quarterly-reports/preview')
                    }
                    className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    icon={<EyeIcon className='h-5 w-5' />}
                  >
                    Design Templates
                  </Button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='flex items-center space-x-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
                    <DocumentTextIcon className='h-8 w-8 text-blue-600' />
                    <div>
                      <h3 className='font-medium text-slate-900 dark:text-white'>
                        Teacher Templates
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        {templatesLoading
                          ? 'Loading...'
                          : `${templates.filter(t => t.type === 'teacher').length} templates available`}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'>
                    <DocumentTextIcon className='h-8 w-8 text-purple-600' />
                    <div>
                      <h3 className='font-medium text-slate-900 dark:text-white'>
                        Association Templates
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        {templatesLoading
                          ? 'Loading...'
                          : `${templates.filter(t => t.type === 'association').length} templates available`}
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

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Template
                    </label>
                    <Select
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      options={templateOptions}
                      placeholder='Select template...'
                      className='w-full'
                      disabled={templatesLoading}
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
                                selectedTeachers.length === teachers.length
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTeachers(teachers.map(t => t.id));
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
                              key={teacher.id}
                              checked={selectedTeachers.includes(teacher.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTeachers(prev => [
                                    ...prev,
                                    teacher.id,
                                  ]);
                                } else {
                                  setSelectedTeachers(prev =>
                                    prev.filter(id => id !== teacher.id)
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
                      !selectedMonth ||
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
                  onClick={() =>
                    router.push('/admin/generate-quarterly-reports/preview')
                  }
                  className='text-primary dark:hover:bg-primary/10'
                >
                  Preview Templates
                </Button>
                <Button
                  variant='outline'
                  onClick={() => router.push('/admin/upload-controller-report')}
                  className='text-primary dark:hover:bg-primary/10'
                >
                  Upload Controller Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
}
