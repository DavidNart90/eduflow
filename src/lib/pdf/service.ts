import {
  TeacherStatementPDF,
  TeacherStatementData,
  StatementTemplate,
  createDefaultTeacherTemplate,
} from './teacher-statement';
import {
  AssociationSummaryPDF,
  AssociationSummaryData,
  AssociationTemplate,
  createDefaultAssociationTemplate,
} from './association-summary';

// Report generation request types
export interface GenerateReportRequest {
  type: 'teacher_statement' | 'association_summary' | 'bulk_statements';
  template_id?: string;
  filters?: {
    teacher_id?: string;
    start_date?: string;
    end_date?: string;
    management_unit?: string;
    include_interest?: boolean;
  };
  bulk_options?: {
    teacher_ids?: string[];
    format?: 'individual' | 'combined';
  };
  generated_by: string;
}

export interface ReportGenerationResult {
  success: boolean;
  report_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  error?: string;
}

export interface BulkReportResult {
  success: boolean;
  job_id: string;
  total_reports: number;
  estimated_duration?: number;
}

// PDF Service class
export class PDFReportService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a single teacher statement PDF
   */
  async generateTeacherStatement(
    teacherId: string,
    options: {
      template?: StatementTemplate;
      startDate?: string;
      endDate?: string;
      generatedBy: string;
    }
  ): Promise<ReportGenerationResult> {
    try {
      // Fetch teacher data
      const teacherData = await this.fetchTeacherStatementData(teacherId, {
        start_date: options.startDate,
        end_date: options.endDate,
      });

      if (!teacherData) {
        return {
          success: false,
          error: 'Teacher data not found',
        };
      }

      // Use provided template or default
      const template = options.template || createDefaultTeacherTemplate();

      // Generate PDF
      const pdfBlob = await TeacherStatementPDF.generate(teacherData, template);

      // Create download URL for the blob
      const file_name = `teacher_statement_${teacherData.teacher.employee_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      const file_url = URL.createObjectURL(pdfBlob);

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

  /**
   * Generate association summary PDF
   */
  async generateAssociationSummary(options: {
    template?: AssociationTemplate;
    startDate?: string;
    endDate?: string;
    quarter?: number;
    year?: number;
    generatedBy: string;
  }): Promise<ReportGenerationResult> {
    try {
      // Fetch association data
      const associationData = await this.fetchAssociationSummaryData({
        start_date: options.startDate,
        end_date: options.endDate,
        quarter: options.quarter,
        year: options.year,
      });

      if (!associationData) {
        return {
          success: false,
          error: 'Association data not found',
        };
      }

      // Use provided template or default
      const template = options.template || createDefaultAssociationTemplate();

      // Generate PDF
      const pdfBlob = await AssociationSummaryPDF.generate(
        associationData,
        template
      );

      // Create download URL for the blob
      const file_name = `association_summary_${options.quarter ? `Q${options.quarter}_` : ''}${options.year || new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.pdf`;
      const file_url = URL.createObjectURL(pdfBlob);

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

  /**
   * Generate bulk teacher statements
   */
  async generateBulkStatements(
    teacherIds: string[],
    options: {
      template?: StatementTemplate;
      startDate?: string;
      endDate?: string;
      format?: 'individual' | 'combined';
      generatedBy: string;
    }
  ): Promise<BulkReportResult> {
    try {
      // For simplicity, we'll generate individual reports
      // In a production system, you might want to implement proper job queuing
      const reports: ReportGenerationResult[] = [];

      for (const teacherId of teacherIds) {
        const result = await this.generateTeacherStatement(teacherId, {
          template: options.template,
          startDate: options.startDate,
          endDate: options.endDate,
          generatedBy: options.generatedBy,
        });
        reports.push(result);
      }

      return {
        success: true,
        job_id: `bulk_${Date.now()}`,
        total_reports: teacherIds.length,
        estimated_duration: teacherIds.length * 2,
      };
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods

  private async fetchTeacherStatementData(
    teacherId: string,
    filters: { start_date?: string; end_date?: string }
  ): Promise<TeacherStatementData | null> {
    const params = new URLSearchParams({
      teacher_id: teacherId,
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
    });

    const response = await fetch(
      `${this.baseUrl}/api/reports/teacher/data?${params}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch teacher data');
    }
    return response.json();
  }

  private async fetchAssociationSummaryData(filters: {
    start_date?: string;
    end_date?: string;
    quarter?: number;
    year?: number;
  }): Promise<AssociationSummaryData | null> {
    const params = new URLSearchParams({
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
      ...(filters.quarter && { quarter: filters.quarter.toString() }),
      ...(filters.year && { year: filters.year.toString() }),
    });

    const response = await fetch(
      `${this.baseUrl}/api/reports/association/data?${params}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch association data');
    }
    return response.json();
  }
}

// Utility functions
export const createPDFService = (baseUrl?: string): PDFReportService => {
  return new PDFReportService(baseUrl);
};

export const validateReportRequest = (
  request: GenerateReportRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!request.type) {
    errors.push('Report type is required');
  }

  if (!request.generated_by) {
    errors.push('Generated by field is required');
  }

  if (request.type === 'teacher_statement' && !request.filters?.teacher_id) {
    errors.push('Teacher ID is required for teacher statements');
  }

  if (
    request.type === 'bulk_statements' &&
    (!request.bulk_options?.teacher_ids ||
      request.bulk_options.teacher_ids.length === 0)
  ) {
    errors.push('Teacher IDs are required for bulk statements');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export all PDF-related types and classes
export * from './teacher-statement';
export * from './association-summary';
export * from './generator';
