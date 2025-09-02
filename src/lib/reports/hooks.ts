import { useState, useCallback } from 'react';
import { ReportsClient, ReportGenerationResult } from './client';

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
