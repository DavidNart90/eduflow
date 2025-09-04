// Client-side functions for report generation

interface GenerateReportRequest {
  type: 'teacher_statement' | 'association_summary' | 'bulk_statements';
  filters?: {
    teacher_id?: string;
    start_date?: string;
    end_date?: string;
  };
  bulk_options?: {
    teacher_ids: string[];
    format: 'individual' | 'combined';
  };
  generated_by: string;
}

export interface ReportGenerationResult {
  success: boolean;
  report_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  job_id?: string;
  total_reports?: number;
  estimated_duration?: number;
  message?: string;
  error?: string;
  details?: string;
  code?: string;
  toast?: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  };
}

export class ReportsClient {
  // Helper to get auth token from Supabase session
  private static async getAuthToken(): Promise<string> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('ReportsClient can only be used in browser environment');
    }

    // Use the Supabase client to get the current session
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    return session.access_token;
  }

  // Generate a single report
  static async generateReport(
    request: GenerateReportRequest
  ): Promise<ReportGenerationResult> {
    try {
      const authToken = await ReportsClient.getAuthToken();

      // Use the correct API endpoint based on report type
      let apiEndpoint = '/api/admin/reports/download'; // fallback
      let requestBody: GenerateReportRequest | Record<string, unknown> =
        request;

      if (request.type === 'teacher_statement') {
        // Use our working teacher-financial endpoint
        apiEndpoint = '/api/admin/reports/teacher-financial';
        requestBody = {
          teacher_id: request.filters?.teacher_id,
          start_date: request.filters?.start_date,
          end_date: request.filters?.end_date,
          format: 'pdf',
        };
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        return {
          success: false,
          error:
            errorResponse.error ||
            `Report generation failed: ${response.statusText}`,
          details: errorResponse.details,
          code: errorResponse.code,
        };
      }

      if (request.type === 'teacher_statement') {
        // For teacher financial reports, handle the JSON response (no auto-download)
        const result = await response.json();
        return {
          success: true,
          message: result.message,
          report_id: result.report?.id,
          file_name: result.report?.file_name,
          file_size: result.report?.file_size,
          toast: result.toast, // Include toast information from server
        };
      }

      // For other types, expect JSON response
      const result = await response.json();
      return result;
    } catch (clientError) {
      return {
        success: false,
        error:
          clientError instanceof Error
            ? clientError.message
            : 'Unknown error occurred',
        code: 'CLIENT_ERROR',
      };
    }
  }

  // Generate bulk teacher statements
  static generateBulkReports(
    teacherIds: string[],
    options: {
      startDate?: string;
      endDate?: string;
      format?: 'individual' | 'combined';
      generatedBy: string;
    }
  ): Promise<ReportGenerationResult> {
    const request: GenerateReportRequest = {
      type: 'bulk_statements',
      filters: {
        start_date: options.startDate,
        end_date: options.endDate,
      },
      bulk_options: {
        teacher_ids: teacherIds,
        format: options.format || 'individual',
      },
      generated_by: options.generatedBy,
    };

    return ReportsClient.generateReport(request);
  }

  // Generate association summary
  static generateAssociationSummary(options: {
    startDate?: string;
    endDate?: string;
    generatedBy: string;
  }): Promise<ReportGenerationResult> {
    const request: GenerateReportRequest = {
      type: 'association_summary',
      filters: {
        start_date: options.startDate,
        end_date: options.endDate,
      },
      generated_by: options.generatedBy,
    };

    return ReportsClient.generateReport(request);
  }

  // Get all teachers for report generation
  static async getAllTeachers(): Promise<
    Array<{
      id: string;
      user_id: string;
      full_name: string;
      employee_id: string;
      management_unit: string;
      email?: string;
      created_at?: string;
      current_balance?: number;
      total_savings?: number;
      total_interest?: number;
    }>
  > {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch('/api/admin/reports/teacher-financial', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      return data.teachers || [];
    } catch {
      // Error fetching teachers
      return [];
    }
  }
}

// Utility functions for date formatting
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getQuarterDates = (quarter: number, year: number) => {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of the quarter
  return { startDate, endDate };
};
