import { useState, useCallback } from 'react';
import { ReportsClient, ReportGenerationResult } from './client';

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

interface Teacher {
  id: string;
  user_id: string; // Add user_id for compatibility
  full_name: string;
  employee_id: string;
  management_unit: string;
  email?: string;
  created_at?: string;
  current_balance?: number;
  total_savings?: number;
  total_interest?: number;
}

export interface UseReportGenerationOptions {
  onSuccess?: (result: ReportGenerationResult) => void;
  onError?: (error: string) => void;
}

export const useReportGeneration = (options?: UseReportGenerationOptions) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<ReportGenerationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const generateTeacherStatement = useCallback(
    async (
      teacherId: string,
      generateOptions: {
        startDate?: string;
        endDate?: string;
        templateId?: string;
        generatedBy: string;
      }
    ) => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await ReportsClient.generateReport({
          type: 'teacher_statement',
          filters: {
            teacher_id: teacherId,
            start_date: generateOptions.startDate,
            end_date: generateOptions.endDate,
          },
          template_id: generateOptions.templateId,
          generated_by: generateOptions.generatedBy,
        });

        setLastResult(result);

        if (result.success) {
          options?.onSuccess?.(result);
        } else {
          const errorMsg =
            result.error || 'Failed to generate teacher statement';
          setError(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        options?.onError?.(errorMsg);

        return {
          success: false,
          error: errorMsg,
        } as ReportGenerationResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [options]
  );

  const generateAssociationSummary = useCallback(
    async (generateOptions: {
      startDate?: string;
      endDate?: string;
      templateId?: string;
      generatedBy: string;
    }) => {
      setIsGenerating(true);
      setError(null);

      try {
        const result =
          await ReportsClient.generateAssociationSummary(generateOptions);
        setLastResult(result);

        if (result.success) {
          options?.onSuccess?.(result);
        } else {
          const errorMsg =
            result.error || 'Failed to generate association summary';
          setError(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        options?.onError?.(errorMsg);

        return {
          success: false,
          error: errorMsg,
        } as ReportGenerationResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [options]
  );

  const generateBulkReports = useCallback(
    async (
      teacherIds: string[],
      generateOptions: {
        startDate?: string;
        endDate?: string;
        templateId?: string;
        format?: 'individual' | 'combined';
        generatedBy: string;
      }
    ) => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await ReportsClient.generateBulkReports(
          teacherIds,
          generateOptions
        );
        setLastResult(result);

        if (result.success) {
          options?.onSuccess?.(result);
        } else {
          const errorMsg = result.error || 'Failed to generate bulk reports';
          setError(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        options?.onError?.(errorMsg);

        return {
          success: false,
          error: errorMsg,
        } as ReportGenerationResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isGenerating,
    lastResult,
    error,
    generateTeacherStatement,
    generateAssociationSummary,
    generateBulkReports,
    clearError,
    clearResult,
  };
};

export const useTemplates = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(
    async (type?: 'teacher' | 'association') => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ReportsClient.getTemplates(type);
        setTemplates(result.templates);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch templates';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createTemplate = useCallback(
    async (template: {
      name: string;
      type: 'teacher' | 'association';
      template_data: Record<string, unknown>;
      is_default?: boolean;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ReportsClient.createTemplate(template);

        if (result.success && result.template) {
          setTemplates(prev => [...prev, result.template!]);
        } else {
          const errorMsg = result.error || 'Failed to create template';
          setError(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to create template';
        setError(errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: {
        name?: string;
        template_data?: Record<string, unknown>;
      }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ReportsClient.updateTemplate(templateId, updates);

        if (result.success && result.template) {
          setTemplates(prev =>
            prev.map(t => (t.id === templateId ? result.template! : t))
          );
        } else {
          const errorMsg = result.error || 'Failed to update template';
          setError(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to update template';
        setError(errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ReportsClient.deleteTemplate(templateId);

      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        const errorMsg = result.error || 'Failed to delete template';
        setError(errorMsg);
      }

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMsg);

      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ReportsClient.getAllTeachers();
      setTeachers(result);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to fetch teachers';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    teachers,
    isLoading,
    error,
    fetchTeachers,
  };
};
