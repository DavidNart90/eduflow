'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Badge, Select } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  success: boolean;
}

interface ProcessingResult {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  processedTransactions: number;
  errors: string[];
  warnings: string[];
  matchedTeachers: Array<{
    name: string;
    amount: number;
    managementUnit: string;
  }>;
  unmatchedTeachers: Array<{
    name: string;
    amount: number;
    managementUnit: string;
    reason: string;
  }>;
}

export default function UploadControllerReportPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    success: false,
  });
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const months = [
    { value: '1', label: 'January 2025' },
    { value: '2', label: 'February 2025' },
    { value: '3', label: 'March 2025' },
    { value: '4', label: 'April 2025' },
    { value: '5', label: 'May 2025' },
    { value: '6', label: 'June 2025' },
    { value: '7', label: 'July 2025' },
    { value: '8', label: 'August 2025' },
    { value: '9', label: 'September 2025' },
    { value: '10', label: 'October 2025' },
    { value: '11', label: 'November 2025' },
    { value: '12', label: 'December 2025' },
  ];

  const years = [
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        showError(
          'Invalid File Type',
          'Only CSV and Excel files are supported'
        );
        setUploadState(prev => ({
          ...prev,
          file: null,
        }));
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 10MB');
        setUploadState(prev => ({
          ...prev,
          file: null,
        }));
        return;
      }

      setUploadState(prev => ({
        ...prev,
        file,
        success: false,
      }));
    },
    [showError]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file || !selectedMonth || !selectedYear) {
      showError(
        'Missing Information',
        'Please select a month, year, and upload a file'
      );
      return;
    }

    setUploadState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
    }));

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', uploadState.file);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);

      // Get auth token from Supabase session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      // Call the API
      const response = await fetch('/api/admin/upload-controller-report', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        success: true,
        progress: 100,
      }));

      setProcessingResult(data.result);
      showSuccess(
        'Upload Successful',
        'Controller report uploaded successfully!'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload file. Please try again.';
      showError('Upload Failed', errorMessage);
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      success: false,
    });
    setSelectedMonth('');
    setSelectedYear('2025');
    setProcessingResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                      width={200}
                      height={24}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-2 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={300}
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

              {/* Loading Main Card */}
              <div className='max-w-4xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-4 md:p-8'>
                    {/* Loading Month Selection */}
                    <div className='mb-8'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={120}
                        height={20}
                        animation='pulse'
                        className='mb-3 rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={200}
                        height={40}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>

                    {/* Loading Upload Area */}
                    <div className='mb-8'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={300}
                        animation='pulse'
                        className='rounded-xl mb-4'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={60}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>

                    {/* Loading Upload Button */}
                    <div className='flex justify-center'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={180}
                        height={48}
                        animation='pulse'
                        className='rounded-xl'
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Loading Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6'>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={140}
                    height={40}
                    animation='pulse'
                    className='rounded-lg'
                  />
                  <div className='flex space-x-4'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={100}
                      height={40}
                      animation='pulse'
                      className='rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={120}
                      height={40}
                      animation='pulse'
                      className='rounded-lg'
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                      Upload Controller Deduction Report
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                      Upload Controller Report
                    </p>
                    <p className='text-slate-500 dark:text-slate-500 text-xs md:text-sm lg:text-center'>
                      Upload monthly deduction reports from the
                      Controller&apos;s Office
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

              {/* Main Upload Card */}
              <div className='max-w-4xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-4 md:p-8'>
                    {/* Month and Year Selection */}
                    <div className='mb-8'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                            Report Month
                          </label>
                          <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={[
                              { value: '', label: 'Select month...' },
                              ...months,
                            ]}
                            placeholder='Select month...'
                            className='w-full'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>
                            Report Year
                          </label>
                          <Select
                            value={selectedYear}
                            onChange={setSelectedYear}
                            options={years}
                            placeholder='Select year...'
                            className='w-full'
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Upload Area */}
                    <div className='mb-8'>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-300 ${
                          dragActive
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : uploadState.file
                              ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type='file'
                          accept='.csv,.xlsx,.xls'
                          onChange={handleFileSelect}
                          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                          disabled={uploadState.uploading}
                        />

                        {uploadState.uploading ? (
                          <div className='space-y-4'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={80}
                              height={80}
                              animation='pulse'
                              className='mx-auto rounded-full'
                            />
                            <div className='space-y-2'>
                              <p className='text-slate-600 dark:text-slate-400'>
                                Uploading... {uploadState.progress}%
                              </p>
                              <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2'>
                                <div
                                  className='bg-primary h-2 rounded-full transition-all duration-300'
                                  style={{ width: `${uploadState.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : uploadState.file ? (
                          <div className='space-y-4'>
                            <CheckCircleIcon className='h-16 w-16 text-green-500 mx-auto' />
                            <div>
                              <p className='text-lg font-medium text-slate-900 dark:text-white'>
                                {uploadState.file.name}
                              </p>
                              <p className='text-sm text-slate-500 dark:text-slate-400'>
                                {formatFileSize(uploadState.file.size)}
                              </p>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={resetUpload}
                              className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            >
                              Choose different file
                            </Button>
                          </div>
                        ) : (
                          <div className='space-y-4'>
                            <div className='mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center'>
                              <CloudArrowUpIcon className='h-8 w-8 text-primary' />
                            </div>
                            <div>
                              <p className='text-lg font-medium text-slate-900 dark:text-white mb-2'>
                                Drop files here or click to browse
                              </p>
                              <p className='text-sm text-slate-500 dark:text-slate-400'>
                                Supports .csv and .xlsx files up to 10MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Requirements */}
                      <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50'>
                        <h4 className='font-medium text-blue-800 dark:text-blue-400 mb-2'>
                          File Requirements:
                        </h4>
                        <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-1'>
                          <li>
                            • Must contain columns: &ldquo;Name of
                            Employee&rdquo; and &ldquo;Monthly&rdquo; (deduction
                            amount)
                          </li>
                          <li>
                            • Optional: &ldquo;Management Unit&rdquo; column for
                            better matching
                          </li>
                          <li>
                            • Supports CSV (.csv) and Excel (.xlsx, .xls) files
                          </li>
                          <li>• Maximum file size: 10MB</li>
                          <li>
                            • Names will be matched with existing teachers in
                            the database
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Success Display */}
                    {uploadState.success && (
                      <div className='mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <CheckCircleIcon className='h-5 w-5 text-green-500' />
                          <p className='text-sm text-green-700 dark:text-green-400'>
                            File uploaded and processed successfully!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Processing Results */}
                    {processingResult && (
                      <div className='mb-6 space-y-4'>
                        {/* Summary Statistics */}
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                          <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                              {processingResult.totalRecords}
                            </div>
                            <div className='text-sm text-blue-600 dark:text-blue-400'>
                              Total Records
                            </div>
                          </div>
                          <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
                            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                              {processingResult.matchedRecords}
                            </div>
                            <div className='text-sm text-green-600 dark:text-green-400'>
                              Matched
                            </div>
                          </div>
                          <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
                            <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
                              {processingResult.unmatchedRecords}
                            </div>
                            <div className='text-sm text-yellow-600 dark:text-yellow-400'>
                              Unmatched
                            </div>
                          </div>
                          <div className='p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800'>
                            <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                              {processingResult.processedTransactions}
                            </div>
                            <div className='text-sm text-purple-600 dark:text-purple-400'>
                              Transactions Created
                            </div>
                          </div>
                        </div>

                        {/* Errors */}
                        {processingResult.errors.length > 0 && (
                          <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                            <h4 className='font-medium text-red-800 dark:text-red-400 mb-2'>
                              Errors ({processingResult.errors.length})
                            </h4>
                            <div className='space-y-1 max-h-32 overflow-y-auto'>
                              {processingResult.errors.map((error, index) => (
                                <p
                                  key={index}
                                  className='text-sm text-red-700 dark:text-red-400'
                                >
                                  • {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warnings */}
                        {processingResult.warnings.length > 0 && (
                          <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
                            <h4 className='font-medium text-yellow-800 dark:text-yellow-400 mb-2'>
                              Warnings ({processingResult.warnings.length})
                            </h4>
                            <div className='space-y-1 max-h-32 overflow-y-auto'>
                              {processingResult.warnings
                                .slice(0, 5)
                                .map((warning, index) => (
                                  <p
                                    key={index}
                                    className='text-sm text-yellow-700 dark:text-yellow-400'
                                  >
                                    • {warning}
                                  </p>
                                ))}
                              {processingResult.warnings.length > 5 && (
                                <p className='text-sm text-yellow-600 dark:text-yellow-500'>
                                  ... and {processingResult.warnings.length - 5}{' '}
                                  more
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Unmatched Teachers */}
                        {processingResult.unmatchedTeachers.length > 0 && (
                          <div className='p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg'>
                            <h4 className='font-medium text-orange-800 dark:text-orange-400 mb-2'>
                              Unmatched Teachers (
                              {processingResult.unmatchedTeachers.length})
                            </h4>
                            <div className='space-y-2 max-h-48 overflow-y-auto'>
                              {processingResult.unmatchedTeachers
                                .slice(0, 10)
                                .map((teacher, index) => (
                                  <div key={index} className='text-sm'>
                                    <div className='font-medium text-orange-800 dark:text-orange-400'>
                                      {teacher.name}
                                    </div>
                                    <div className='text-orange-600 dark:text-orange-500'>
                                      Amount: GHS {teacher.amount.toFixed(2)} •{' '}
                                      {teacher.managementUnit}
                                    </div>
                                    <div className='text-orange-500 dark:text-orange-600'>
                                      Reason: {teacher.reason}
                                    </div>
                                  </div>
                                ))}
                              {processingResult.unmatchedTeachers.length >
                                10 && (
                                <p className='text-sm text-orange-600 dark:text-orange-500'>
                                  ... and{' '}
                                  {processingResult.unmatchedTeachers.length -
                                    10}{' '}
                                  more unmatched teachers
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className='flex justify-center'>
                      <Button
                        variant='primary'
                        size='lg'
                        onClick={handleUpload}
                        disabled={
                          !uploadState.file ||
                          !selectedMonth ||
                          !selectedYear ||
                          uploadState.uploading
                        }
                        className='px-8 py-3 text-primary-500 dark:text-white bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed'
                        icon={<DocumentArrowUpIcon className='h-5 w-5' />}
                      >
                        {uploadState.uploading
                          ? 'Uploading...'
                          : 'Upload Report'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6'>
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
                      onClick={() => router.push('/admin/reports')}
                      className='text-primary dark:hover:bg-primary/10'
                    >
                      View Reports
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/manage-teachers')}
                      className='text-primary dark:hover:bg-primary/10'
                    >
                      Manage Teachers
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
