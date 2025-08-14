'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Badge, Select } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export default function UploadControllerReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  const [dragActive, setDragActive] = useState(false);

  const months = [
    { value: 'january', label: 'January 2025' },
    { value: 'february', label: 'February 2025' },
    { value: 'march', label: 'March 2025' },
    { value: 'april', label: 'April 2025' },
    { value: 'may', label: 'May 2025' },
    { value: 'june', label: 'June 2025' },
    { value: 'july', label: 'July 2025' },
    { value: 'august', label: 'August 2025' },
    { value: 'september', label: 'September 2025' },
    { value: 'october', label: 'October 2025' },
    { value: 'november', label: 'November 2025' },
    { value: 'december', label: 'December 2025' },
  ];

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Only CSV and Excel files are supported',
        file: null,
      }));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 10MB',
        file: null,
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      success: false,
    }));
  };

  const handleUpload = async () => {
    if (!uploadState.file || !selectedMonth) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a month and upload a file',
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
      error: null,
    }));

    try {
      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadState(prev => ({
          ...prev,
          progress: i,
        }));
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        success: true,
        progress: 100,
      }));
    } catch {
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: 'Failed to upload file. Please try again.',
        progress: 0,
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
    });
    setSelectedMonth('');
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
                    {/* Month Selection */}
                    <div className='mb-8'>
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
                        className='max-w-xs'
                      />
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
                        <p className='text-sm text-slate-600 dark:text-slate-400 text-center'>
                          Only files with Name and Deduction columns are
                          supported
                        </p>
                      </div>
                    </div>

                    {/* Error Display */}
                    {uploadState.error && (
                      <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <ExclamationTriangleIcon className='h-5 w-5 text-red-500' />
                          <p className='text-sm text-red-700 dark:text-red-400'>
                            {uploadState.error}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Success Display */}
                    {uploadState.success && (
                      <div className='mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <CheckCircleIcon className='h-5 w-5 text-green-500' />
                          <p className='text-sm text-green-700 dark:text-green-400'>
                            File uploaded successfully! Processing will begin
                            shortly.
                          </p>
                        </div>
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
