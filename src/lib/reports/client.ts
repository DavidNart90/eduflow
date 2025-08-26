// Client-side functions for report generation and template management

interface GenerateReportRequest {
  type: 'teacher_statement' | 'association_summary' | 'bulk_statements';
  filters?: {
    teacher_id?: string;
    start_date?: string;
    end_date?: string;
  };
  template_id?: string;
  bulk_options?: {
    teacher_ids: string[];
    format: 'individual' | 'combined';
  };
  generated_by: string;
}

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

export interface ReportGenerationResult {
  success: boolean;
  report_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  job_id?: string;
  total_reports?: number;
  estimated_duration?: number;
  error?: string;
}

export class ReportsClient {
  // Helper to get auth token from Supabase session
  private static async getAuthToken(): Promise<string> {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      // Import supabase client dynamically to avoid SSR issues
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
    }
  }

  // Generate a single report
  static async generateReport(
    request: GenerateReportRequest
  ): Promise<ReportGenerationResult> {
    try {
      const authToken = await ReportsClient.getAuthToken();

      const response = await fetch('/api/admin/reports/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create download URL
      const file_url = URL.createObjectURL(pdfBlob);

      // Extract filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let file_name = 'report.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (fileNameMatch) {
          file_name = fileNameMatch[1];
        }
      }

      return {
        success: true,
        file_url,
        file_name,
        file_size: pdfBlob.size,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generate bulk teacher statements
  static generateBulkReports(
    teacherIds: string[],
    options: {
      startDate?: string;
      endDate?: string;
      templateId?: string;
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
      template_id: options.templateId,
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
    templateId?: string;
    generatedBy: string;
  }): Promise<ReportGenerationResult> {
    const request: GenerateReportRequest = {
      type: 'association_summary',
      filters: {
        start_date: options.startDate,
        end_date: options.endDate,
      },
      template_id: options.templateId,
      generated_by: options.generatedBy,
    };

    return ReportsClient.generateReport(request);
  }

  // Get all templates
  static async getTemplates(type?: 'teacher' | 'association'): Promise<{
    templates: ReportTemplate[];
    total: number;
  }> {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const url = new URL(
        '/api/admin/reports/templates',
        window.location.origin
      );
      if (type) {
        url.searchParams.set('type', type);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      return await response.json();
    } catch {
      return {
        templates: [],
        total: 0,
      };
    }
  }

  // Create a new template
  static async createTemplate(template: {
    name: string;
    type: 'teacher' | 'association';
    template_data: Record<string, unknown>;
    is_default?: boolean;
  }): Promise<{ success: boolean; template?: ReportTemplate; error?: string }> {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch('/api/admin/reports/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      const result = await response.json();
      return {
        success: true,
        template: result.template,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Update an existing template
  static async updateTemplate(
    templateId: string,
    updates: {
      name?: string;
      template_data?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; template?: ReportTemplate; error?: string }> {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch(
        `/api/admin/reports/templates/${templateId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      const result = await response.json();
      return {
        success: true,
        template: result.template,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Delete a template (soft delete)
  static async deleteTemplate(
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch(
        `/api/admin/reports/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Get teacher data for reports
  static async getTeacherData(
    teacherId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const url = new URL('/api/reports/teacher/data', window.location.origin);
      url.searchParams.set('teacher_id', teacherId);
      if (options?.startDate) {
        url.searchParams.set('start_date', options.startDate);
      }
      if (options?.endDate) {
        url.searchParams.set('end_date', options.endDate);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher data');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch teacher data'
      );
    }
  }

  // Get association data for reports
  static async getAssociationData(options?: {
    startDate?: string;
    endDate?: string;
    year?: string;
    quarter?: string;
  }) {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const url = new URL(
        '/api/reports/association/data',
        window.location.origin
      );
      if (options?.startDate) {
        url.searchParams.set('start_date', options.startDate);
      }
      if (options?.endDate) {
        url.searchParams.set('end_date', options.endDate);
      }
      if (options?.year) {
        url.searchParams.set('year', options.year);
      }
      if (options?.quarter) {
        url.searchParams.set('quarter', options.quarter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch association data');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch association data'
      );
    }
  }

  // Get all teachers for bulk operations
  static async getAllTeachers(): Promise<
    Array<{
      id: string;
      full_name: string;
      employee_id: string;
      management_unit: string;
    }>
  > {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch('/api/admin/teachers', {
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
      return [];
    }
  }

  // Get report generation status (for bulk operations)
  static async getReportStatus(jobId: string) {
    try {
      const authToken = await ReportsClient.getAuthToken();
      const response = await fetch(`/api/admin/reports/status/${jobId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report status');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch report status'
      );
    }
  }
}

// Helper functions for date formatting
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getQuarterDates = (year: number, quarter: number) => {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;

  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, endMonth + 1, 0), // Last day of the quarter
  };
};

export const getMonthDates = (year: number, month: number) => {
  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0), // Last day of the month
  };
};
