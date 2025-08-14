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
  Input,
} from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface TemplateVariation {
  id: string;
  name: string;
  type: 'teacher' | 'association';
  isDefault: boolean;
  lastModified: string;
  previewUrl: string;
  config: {
    headerColor: string;
    font: string;
    logoPosition: string;
    includeSignature: boolean;
    includeWatermark: boolean;
  };
}

export default function TemplatePreviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teacher' | 'association'>(
    'teacher'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Sample template data
  const [templates] = useState<TemplateVariation[]>([
    {
      id: '1',
      name: 'Classic Blue Template',
      type: 'teacher',
      isDefault: true,
      lastModified: '2024-12-15',
      previewUrl: '/previews/teacher-classic-blue.png',
      config: {
        headerColor: '#2563eb',
        font: 'Inter',
        logoPosition: 'top-left',
        includeSignature: true,
        includeWatermark: false,
      },
    },
    {
      id: '2',
      name: 'Modern Green Template',
      type: 'teacher',
      isDefault: false,
      lastModified: '2024-12-14',
      previewUrl: '/previews/teacher-modern-green.png',
      config: {
        headerColor: '#059669',
        font: 'Roboto',
        logoPosition: 'top-center',
        includeSignature: true,
        includeWatermark: true,
      },
    },
    {
      id: '3',
      name: 'Executive Template',
      type: 'association',
      isDefault: true,
      lastModified: '2024-12-13',
      previewUrl: '/previews/association-executive.png',
      config: {
        headerColor: '#7c3aed',
        font: 'Times New Roman',
        logoPosition: 'top-center',
        includeSignature: true,
        includeWatermark: true,
      },
    },
  ]);

  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
  ];

  const logoPositions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
  ];

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const teacherTemplates = templates.filter(t => t.type === 'teacher');
  const associationTemplates = templates.filter(t => t.type === 'association');
  const currentTemplates =
    activeTab === 'teacher' ? teacherTemplates : associationTemplates;

  const canCreateMore = currentTemplates.length < 5;

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
                      width={350}
                      height={24}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-2 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={450}
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

              {/* Loading Tabs */}
              <div className='max-w-6xl mx-auto mb-6'>
                <div className='flex space-x-4'>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={120}
                    height={40}
                    animation='pulse'
                    className='rounded-lg'
                  />
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={150}
                    height={40}
                    animation='pulse'
                    className='rounded-lg'
                  />
                </div>
              </div>

              {/* Loading Template Grid */}
              <div className='max-w-6xl mx-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <MuiSkeletonComponent
                      key={i}
                      variant='rectangular'
                      width={'100%'}
                      height={400}
                      animation='pulse'
                      className='rounded-xl'
                    />
                  ))}
                </div>

                {/* Loading Configuration Panel */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={200}
                      height={24}
                      animation='pulse'
                      className='mb-6 rounded-lg'
                    />

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className='mb-4'>
                            <MuiSkeletonComponent
                              variant='rectangular'
                              width={120}
                              height={16}
                              animation='pulse'
                              className='mb-2 rounded-lg'
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
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={300}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
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
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent'>
                      Template Designer & Preview
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                      Design and customize report templates for teachers and
                      association reports
                    </p>
                    <p className='text-slate-500 dark:text-slate-500 mt-1 text-sm lg:text-center'>
                      Create up to 5 template variations for each report type
                    </p>
                  </div>
                  <Badge
                    variant='primary'
                    className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  >
                    Designer
                  </Badge>
                </div>
              </div>

              {/* Template Type Tabs */}
              <div className='max-w-6xl mx-auto mb-6'>
                <div className='flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1'>
                  <button
                    onClick={() => setActiveTab('teacher')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'teacher'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Teacher Reports ({teacherTemplates.length}/5)
                  </button>
                  <button
                    onClick={() => setActiveTab('association')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'association'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Association Reports ({associationTemplates.length}/5)
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className='max-w-6xl mx-auto'>
                {/* Template Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                  {/* Existing Templates */}
                  {currentTemplates.map(template => (
                    <Card
                      key={template.id}
                      variant='glass'
                      className={`border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-all cursor-pointer ${
                        selectedTemplate === template.id
                          ? 'ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className='p-0'>
                        {/* Template Preview */}
                        <div className='relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-t-lg flex items-center justify-center'>
                          <DocumentTextIcon className='h-16 w-16 text-slate-400' />
                          <div
                            className='absolute top-2 right-2 w-4 h-4 rounded-full'
                            style={{
                              backgroundColor: template.config.headerColor,
                            }}
                          />
                          {template.isDefault && (
                            <Badge
                              variant='success'
                              className='absolute top-2 left-2 text-xs'
                            >
                              Default
                            </Badge>
                          )}
                        </div>

                        {/* Template Info */}
                        <div className='p-4'>
                          <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                            {template.name}
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
                            Modified: {template.lastModified}
                          </p>

                          {/* Template Config Summary */}
                          <div className='flex flex-wrap gap-1 mb-4'>
                            <Badge variant='secondary' className='text-xs'>
                              {template.config.font}
                            </Badge>
                            <Badge variant='secondary' className='text-xs'>
                              {template.config.logoPosition}
                            </Badge>
                            {template.config.includeSignature && (
                              <Badge variant='secondary' className='text-xs'>
                                Signature
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className='flex space-x-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1 !text-primary !border-primary/20 hover:!bg-primary/10'
                              icon={<EyeIcon className='h-4 w-4' />}
                            >
                              Preview
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='!text-slate-600 hover:!text-slate-900'
                              icon={<PencilIcon className='h-4 w-4' />}
                              onClick={e => {
                                e.stopPropagation();
                                /*TODO: Implement template editing*/
                              }}
                            />
                            {!template.isDefault && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='!text-red-600 hover:!text-red-700'
                                icon={<TrashIcon className='h-4 w-4' />}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Create New Template Card */}
                  {canCreateMore && (
                    <Card
                      variant='glass'
                      className='border-dashed border-2 border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                      onClick={() => {
                        /*TODO: Implement create new template modal*/
                      }}
                    >
                      <CardContent className='p-2 md:p-6 flex flex-col items-center justify-center h-full min-h-[300px]'>
                        <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
                          <PlusIcon className='h-8 w-8 text-primary' />
                        </div>
                        <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                          Create New Template
                        </h3>
                        <p className='text-sm text-slate-600 dark:text-slate-400 text-center'>
                          Design a new {activeTab} report template
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Maximum Templates Reached */}
                  {!canCreateMore && (
                    <Card
                      variant='glass'
                      className='border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50'
                    >
                      <CardContent className='p-8 flex flex-col items-center justify-center h-full min-h-[300px]'>
                        <div className='w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4'>
                          <XMarkIcon className='h-8 w-8 text-slate-500' />
                        </div>
                        <h3 className='font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                          Maximum Reached
                        </h3>
                        <p className='text-sm text-slate-500 dark:text-slate-400 text-center'>
                          You&apos;ve reached the maximum of 5 templates for{' '}
                          {activeTab} reports
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Template Configuration Panel */}
                {selectedTemplate && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                  >
                    <CardContent className='p-2 md:p-8'>
                      <div className='md:flex justify-between items-center space-y-4'>
                        <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                          Template Configuration
                        </h2>
                        <div className='flex space-x-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='!text-primary !border-primary/20 hover:!bg-primary/10'
                            icon={<DocumentArrowDownIcon className='h-4 w-4' />}
                          >
                            Export Template
                          </Button>
                          <Button
                            variant='primary'
                            size='sm'
                            className='to-blue-600'
                            icon={<CheckCircleIcon className='h-4 w-4' />}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                        {/* Configuration Form */}
                        <div className='space-y-6'>
                          {/* Template Name */}
                          <div>
                            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                              Template Name
                            </label>
                            <Input
                              placeholder='Enter template name'
                              defaultValue={
                                templates.find(t => t.id === selectedTemplate)
                                  ?.name
                              }
                              className='w-full'
                            />
                          </div>

                          {/* Header Color */}
                          <div>
                            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                              Header Color
                            </label>
                            <div className='flex space-x-2'>
                              <Input
                                type='color'
                                defaultValue={
                                  templates.find(t => t.id === selectedTemplate)
                                    ?.config.headerColor
                                }
                                className='w-16 h-10 p-1 rounded-lg'
                              />
                              <Input
                                placeholder='#2563eb'
                                defaultValue={
                                  templates.find(t => t.id === selectedTemplate)
                                    ?.config.headerColor
                                }
                                className='flex-1'
                              />
                            </div>
                          </div>

                          {/* Font Selection */}
                          <div>
                            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                              Font Family
                            </label>
                            <Select
                              options={fontOptions}
                              defaultValue={
                                templates.find(t => t.id === selectedTemplate)
                                  ?.config.font
                              }
                              className='w-full'
                            />
                          </div>

                          {/* Logo Position */}
                          <div>
                            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                              Logo Position
                            </label>
                            <Select
                              options={logoPositions}
                              defaultValue={
                                templates.find(t => t.id === selectedTemplate)
                                  ?.config.logoPosition
                              }
                              className='w-full'
                            />
                          </div>

                          {/* Additional Options */}
                          <div className='space-y-3'>
                            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>
                              Additional Options
                            </label>
                            <div className='space-y-2'>
                              <label className='flex items-center space-x-2'>
                                <input
                                  type='checkbox'
                                  defaultChecked={
                                    templates.find(
                                      t => t.id === selectedTemplate
                                    )?.config.includeSignature
                                  }
                                  className='rounded border-slate-300'
                                />
                                <span className='text-sm text-slate-700 dark:text-slate-300'>
                                  Include Signature Block
                                </span>
                              </label>
                              <label className='flex items-center space-x-2'>
                                <input
                                  type='checkbox'
                                  defaultChecked={
                                    templates.find(
                                      t => t.id === selectedTemplate
                                    )?.config.includeWatermark
                                  }
                                  className='rounded border-slate-300'
                                />
                                <span className='text-sm text-slate-700 dark:text-slate-300'>
                                  Include Watermark
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Live Preview */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4'>
                            Live Preview
                          </label>
                          <div className='border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 bg-white dark:bg-slate-900 min-h-[400px] flex items-center justify-center'>
                            <div className='text-center'>
                              <DocumentTextIcon className='h-16 w-16 text-slate-400 mx-auto mb-4' />
                              <p className='text-slate-600 dark:text-slate-400'>
                                Template preview will appear here
                              </p>
                              <p className='text-sm text-slate-500 dark:text-slate-500 mt-2'>
                                Changes will be reflected in real-time
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                  {/* Import Template */}
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                          <DocumentDuplicateIcon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div>
                          <h3 className='font-medium text-slate-900 dark:text-white'>
                            Import Template
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            Upload existing design
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Template Library */}
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center'>
                          <PhotoIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                        </div>
                        <div>
                          <h3 className='font-medium text-slate-900 dark:text-white'>
                            Template Library
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            Browse pre-made designs
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                          <Cog6ToothIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
                        </div>
                        <div>
                          <h3 className='font-medium text-slate-900 dark:text-white'>
                            Advanced Settings
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            CSS & custom styling
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6 mt-6'>
                  <Button
                    variant='ghost'
                    onClick={() =>
                      router.push('/admin/generate-quarterly-reports')
                    }
                    className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    icon={<ArrowLeftIcon className='h-4 w-4' />}
                  >
                    Back to Generation Dashboard
                  </Button>

                  <div className='flex space-x-4'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/dashboard')}
                      className='text-primary hover:bg-primary/10'
                    >
                      Admin Dashboard
                    </Button>
                    <Button
                      variant='primary'
                      className='text-white hover:bg-primary/10'
                    >
                      Preview All Templates
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
