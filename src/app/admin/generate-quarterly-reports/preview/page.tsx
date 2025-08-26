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
import { useTemplates } from '@/lib/reports/hooks';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'teacher' | 'association';
  template_data: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TemplatePreviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teacher' | 'association'>(
    'teacher'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showErrors, setShowErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    templateId: string;
    templateName: string;
  }>({ show: false, templateId: '', templateName: '' });
  const [templateConfig, setTemplateConfig] = useState({
    headerColor: '#2563eb',
    font: 'Inter',
    logoPosition: 'top-left',
    includeSignature: true,
    includeWatermark: false,
  });

  // Use real templates from database
  const {
    templates,
    isLoading: templatesLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();

  // Fetch templates on component mount and when tab changes
  useEffect(() => {
    fetchTemplates(activeTab);
  }, [activeTab, fetchTemplates]);

  // Update loading state based on templates loading
  useEffect(() => {
    setIsLoading(templatesLoading);
  }, [templatesLoading]);

  // Helper function to parse template config
  const getTemplateConfig = (template: ReportTemplate) => {
    const config = template.template_data?.config as Record<string, unknown>;
    return {
      headerColor: (config?.headerColor as string) || '#2563eb',
      font: (config?.font as string) || 'Inter',
      logoPosition: (config?.logoPosition as string) || 'top-left',
      includeSignature: (config?.includeSignature as boolean) !== false,
      includeWatermark: (config?.includeWatermark as boolean) || false,
    };
  };

  // Update template config when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setTemplateConfig(getTemplateConfig(template));
      }
    }
  }, [selectedTemplate, templates]);

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

  // Simulate loading state - remove this since we now use real loading
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsLoading(false);
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  const teacherTemplates = templates.filter(t => t.type === 'teacher');
  const associationTemplates = templates.filter(t => t.type === 'association');
  const currentTemplates =
    activeTab === 'teacher' ? teacherTemplates : associationTemplates;

  const canCreateMore = currentTemplates.length < 5;

  // Handle template deletion
  const handleDeleteTemplate = (
    templateId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setConfirmDelete({
        show: true,
        templateId,
        templateName: template.name,
      });
    }
  };

  // Confirm and execute template deletion
  const confirmDeleteTemplate = async () => {
    if (!confirmDelete.templateId) return;

    try {
      const result = await deleteTemplate(confirmDelete.templateId);
      if (result.success) {
        setShowSuccess('Template deleted successfully');
        setShowErrors([]);
      } else {
        setShowErrors([result.error || 'Failed to delete template']);
        setShowSuccess('');
      }
    } catch (error) {
      setShowErrors([
        `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
      setShowSuccess('');
    } finally {
      setConfirmDelete({ show: false, templateId: '', templateName: '' });
    }
  };

  // Handle template editing
  const handleEditTemplate = (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Set the template as selected for editing
    setSelectedTemplate(templateId);
    // Scroll to configuration panel
    setTimeout(() => {
      const configPanel = document.querySelector('[data-template-config]');
      configPanel?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle save template changes
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    const selectedTemp = templates.find(t => t.id === selectedTemplate);
    if (!selectedTemp) return;

    const updatedTemplateData = {
      config: templateConfig,
      version: '1.1',
      lastModified: new Date().toISOString(),
      updatedBy: user?.employee_id || user?.email || 'admin',
    };

    try {
      const result = await updateTemplate(selectedTemplate, {
        template_data: updatedTemplateData,
      });

      if (result.success) {
        setShowSuccess('Template saved successfully');
        setShowErrors([]);
      } else {
        setShowErrors([result.error || 'Failed to save template']);
        setShowSuccess('');
      }
    } catch (error) {
      setShowErrors([
        `Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
      setShowSuccess('');
    }
  };

  // Handle template export
  const handleExportTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      try {
        // Create downloadable JSON file
        const dataStr = JSON.stringify(template, null, 2);
        const dataUri =
          'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        setShowSuccess('Template exported successfully');
        setShowErrors([]);
      } catch (error) {
        setShowErrors([
          `Failed to export template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ]);
        setShowSuccess('');
      }
    }
  };

  // Handle template import
  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const templateData = JSON.parse(text);

          // Create new template with imported data
          const result = await createTemplate({
            name: `${templateData.name} (Imported)`,
            type: activeTab,
            template_data: templateData.template_data,
          });

          if (result.success) {
            setShowSuccess('Template imported successfully');
            setShowErrors([]);
            fetchTemplates(activeTab);
          }
        } catch (error) {
          setShowErrors([
            `Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format.`,
          ]);
          setShowSuccess('');
        }
      }
    };
    input.click();
  };

  // Handle create new template
  const handleCreateTemplate = () => {
    const defaultConfig = {
      headerColor: '#2563eb',
      font: 'Inter',
      logoPosition: 'top-left',
      includeSignature: true,
      includeWatermark: false,
    };

    createTemplate({
      name: `New ${activeTab} Template`,
      type: activeTab,
      template_data: {
        config: defaultConfig,
        version: '1.0',
        elements: [],
        createdBy: user?.employee_id || user?.email || 'admin',
      },
    })
      .then(result => {
        if (result.success) {
          setShowSuccess('Template created successfully');
          setShowErrors([]);
          // Refresh templates
          fetchTemplates(activeTab);
        }
      })
      .catch((error: Error) => {
        setShowErrors([`Failed to create template: ${error.message}`]);
        setShowSuccess('');
      });
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
              {/* Success Display */}
              {showSuccess && (
                <div className='mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <CheckCircleIcon className='h-5 w-5 text-green-600' />
                      <p className='text-green-600 dark:text-green-400 text-sm'>
                        {showSuccess}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowSuccess('')}
                      className='text-green-600 hover:text-green-700'
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom Error Display */}
              {showErrors.length > 0 && (
                <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-3'>
                      <XMarkIcon className='h-5 w-5 text-red-600 mt-0.5' />
                      <div className='flex-1'>
                        {showErrors.map((error, index) => (
                          <p
                            key={index}
                            className='text-red-600 dark:text-red-400 text-sm mb-1'
                          >
                            {error}
                          </p>
                        ))}
                      </div>
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
                </div>
              )}

              {/* API Error Display */}
              {error && (
                <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <p className='text-red-600 dark:text-red-400 text-sm'>
                    Error loading templates: {error}
                  </p>
                </div>
              )}

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
                              backgroundColor:
                                getTemplateConfig(template).headerColor,
                            }}
                          />
                          {template.is_default && (
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
                            Modified:{' '}
                            {new Date(template.updated_at).toLocaleDateString()}
                          </p>

                          {/* Template Config Summary */}
                          <div className='flex flex-wrap gap-1 mb-4'>
                            <Badge variant='secondary' className='text-xs'>
                              {getTemplateConfig(template).font}
                            </Badge>
                            <Badge variant='secondary' className='text-xs'>
                              {getTemplateConfig(template).logoPosition}
                            </Badge>
                            {getTemplateConfig(template).includeSignature && (
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
                              onClick={e => handleEditTemplate(template.id, e)}
                            />
                            {!template.is_default && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='!text-red-600 hover:!text-red-700'
                                icon={<TrashIcon className='h-4 w-4' />}
                                onClick={e =>
                                  handleDeleteTemplate(template.id, e)
                                }
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
                      onClick={handleCreateTemplate}
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
                    data-template-config
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
                            onClick={handleExportTemplate}
                          >
                            Export Template
                          </Button>
                          <Button
                            variant='primary'
                            size='sm'
                            className='to-blue-600'
                            icon={<CheckCircleIcon className='h-4 w-4' />}
                            onClick={handleSaveTemplate}
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
                                value={templateConfig.headerColor}
                                onChange={e =>
                                  setTemplateConfig(prev => ({
                                    ...prev,
                                    headerColor: e.target.value,
                                  }))
                                }
                                className='w-16 h-10 p-1 rounded-lg'
                              />
                              <Input
                                placeholder='#2563eb'
                                value={templateConfig.headerColor}
                                onChange={e =>
                                  setTemplateConfig(prev => ({
                                    ...prev,
                                    headerColor: e.target.value,
                                  }))
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
                              value={templateConfig.font}
                              onChange={value =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  font: value,
                                }))
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
                              value={templateConfig.logoPosition}
                              onChange={value =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  logoPosition: value,
                                }))
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
                                  checked={templateConfig.includeSignature}
                                  onChange={e =>
                                    setTemplateConfig(prev => ({
                                      ...prev,
                                      includeSignature: e.target.checked,
                                    }))
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
                                  checked={templateConfig.includeWatermark}
                                  onChange={e =>
                                    setTemplateConfig(prev => ({
                                      ...prev,
                                      includeWatermark: e.target.checked,
                                    }))
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
                          <div className='border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 bg-white dark:bg-slate-900 min-h-[400px] relative overflow-hidden'>
                            {selectedTemplate ? (
                              <div className='w-full h-full bg-white border rounded-lg shadow-sm overflow-hidden'>
                                {/* Template Header */}
                                <div
                                  className='p-4 text-white font-semibold text-lg'
                                  style={{
                                    backgroundColor: templateConfig.headerColor,
                                  }}
                                >
                                  <div
                                    className={`flex items-center ${
                                      templateConfig.logoPosition ===
                                      'top-center'
                                        ? 'justify-center'
                                        : templateConfig.logoPosition ===
                                            'top-right'
                                          ? 'justify-end'
                                          : 'justify-start'
                                    }`}
                                  >
                                    <div className='w-8 h-8 bg-white/20 rounded mr-3'></div>
                                    Eduflow{' '}
                                    {templates.find(
                                      t => t.id === selectedTemplate
                                    )?.type === 'teacher'
                                      ? 'Teacher'
                                      : 'Association'}{' '}
                                    Report
                                  </div>
                                </div>

                                {/* Template Body */}
                                <div
                                  className='p-6 space-y-4'
                                  style={{ fontFamily: templateConfig.font }}
                                >
                                  <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='font-medium'>
                                      Report Period:
                                    </span>
                                    <span>Jan 2025 - Mar 2025</span>
                                  </div>

                                  <div className='grid grid-cols-2 gap-4 text-sm'>
                                    <div>
                                      <span className='font-medium'>
                                        Total Savings:
                                      </span>
                                      <div className='text-lg font-bold'>
                                        ₵2,450.00
                                      </div>
                                    </div>
                                    <div>
                                      <span className='font-medium'>
                                        Interest Earned:
                                      </span>
                                      <div className='text-lg font-bold text-green-600'>
                                        ₵125.50
                                      </div>
                                    </div>
                                  </div>

                                  <div className='mt-6 space-y-2'>
                                    <div className='text-sm font-medium'>
                                      Recent Transactions:
                                    </div>
                                    <div className='space-y-1 text-xs'>
                                      <div className='flex justify-between p-2 bg-gray-50 rounded'>
                                        <span>Jan 15, 2025</span>
                                        <span>+₵200.00</span>
                                      </div>
                                      <div className='flex justify-between p-2 bg-gray-50 rounded'>
                                        <span>Feb 10, 2025</span>
                                        <span>+₵300.00</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Watermark */}
                                  {templateConfig.includeWatermark && (
                                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                                      <div className='text-6xl font-bold text-gray-100 transform rotate-45'>
                                        PREVIEW
                                      </div>
                                    </div>
                                  )}

                                  {/* Signature Block */}
                                  {templateConfig.includeSignature && (
                                    <div className='mt-8 pt-4 border-t'>
                                      <div className='text-xs text-gray-600'>
                                        <div>Generated by: Admin User</div>
                                        <div>
                                          Date:{' '}
                                          {new Date().toLocaleDateString()}
                                        </div>
                                        <div className='mt-2 flex space-x-8'>
                                          <div>
                                            <div className='border-b border-gray-400 w-32 mb-1'></div>
                                            <div>Teacher Signature</div>
                                          </div>
                                          <div>
                                            <div className='border-b border-gray-400 w-32 mb-1'></div>
                                            <div>Admin Signature</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className='text-center'>
                                <DocumentTextIcon className='h-16 w-16 text-slate-400 mx-auto mb-4' />
                                <p className='text-slate-600 dark:text-slate-400'>
                                  Select a template to see preview
                                </p>
                                <p className='text-sm text-slate-500 dark:text-slate-500 mt-2'>
                                  Configuration changes will be reflected in
                                  real-time
                                </p>
                              </div>
                            )}
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
                    onClick={handleImportTemplate}
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

          {/* Delete Confirmation Dialog */}
          {confirmDelete.show && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
              <Card variant='glass' className='max-w-md mx-4'>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-3 mb-4'>
                    <div className='w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
                      <TrashIcon className='h-6 w-6 text-red-600' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-slate-900 dark:text-white'>
                        Delete Template
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <p className='text-slate-700 dark:text-slate-300 mb-6'>
                    Are you sure you want to delete &quot;
                    {confirmDelete.templateName}&quot;? This will permanently
                    remove the template and it cannot be recovered.
                  </p>

                  <div className='flex space-x-3'>
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={() =>
                        setConfirmDelete({
                          show: false,
                          templateId: '',
                          templateName: '',
                        })
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='primary'
                      className='flex-1 bg-red-600 hover:bg-red-700'
                      onClick={confirmDeleteTemplate}
                    >
                      Delete Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
}
