import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  PDFReportService,
  validateReportRequest,
  GenerateReportRequest,
  createDefaultTeacherTemplate,
  createDefaultAssociationTemplate,
} from '@/lib/pdf';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateReportRequest = await request.json();

    // Validate request
    const validation = validateReportRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      );
    }

    // Get user from authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify admin access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('email', body.generated_by)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Initialize PDF service
    const pdfService = new PDFReportService();

    let result;

    switch (body.type) {
      case 'teacher_statement': {
        if (!body.filters?.teacher_id) {
          return NextResponse.json(
            { error: 'Teacher ID required for teacher statements' },
            { status: 400 }
          );
        }

        // Get template if specified
        let teacherTemplate = createDefaultTeacherTemplate();
        if (body.template_id) {
          const templateData = await getReportTemplate(
            supabase,
            body.template_id,
            'teacher'
          );
          if (templateData) {
            teacherTemplate = {
              ...teacherTemplate,
              ...templateData.template_data,
            };
          }
        }

        result = await pdfService.generateTeacherStatement(
          body.filters.teacher_id,
          {
            template: teacherTemplate,
            startDate: body.filters.start_date,
            endDate: body.filters.end_date,
            generatedBy: user.full_name,
          }
        );
        break;
      }

      case 'association_summary': {
        // Get template if specified
        let associationTemplate = createDefaultAssociationTemplate();
        if (body.template_id) {
          const templateData = await getReportTemplate(
            supabase,
            body.template_id,
            'association'
          );
          if (templateData) {
            associationTemplate = {
              ...associationTemplate,
              ...templateData.template_data,
            };
          }
        }

        // Determine quarter and year from filters
        let quarter: number | undefined;
        let year: number | undefined;

        if (body.filters?.end_date) {
          const endDate = new Date(body.filters.end_date);
          year = endDate.getFullYear();
          quarter = Math.ceil((endDate.getMonth() + 1) / 3);
        }

        result = await pdfService.generateAssociationSummary({
          template: associationTemplate,
          startDate: body.filters?.start_date,
          endDate: body.filters?.end_date,
          quarter,
          year,
          generatedBy: user.full_name,
        });
        break;
      }

      case 'bulk_statements': {
        if (
          !body.bulk_options?.teacher_ids ||
          body.bulk_options.teacher_ids.length === 0
        ) {
          return NextResponse.json(
            { error: 'Teacher IDs required for bulk statements' },
            { status: 400 }
          );
        }

        // Get template if specified
        let bulkTemplate = createDefaultTeacherTemplate();
        if (body.template_id) {
          const templateData = await getReportTemplate(
            supabase,
            body.template_id,
            'teacher'
          );
          if (templateData) {
            bulkTemplate = { ...bulkTemplate, ...templateData.template_data };
          }
        }

        const bulkResult = await pdfService.generateBulkStatements(
          body.bulk_options.teacher_ids,
          {
            template: bulkTemplate,
            startDate: body.filters?.start_date,
            endDate: body.filters?.end_date,
            format: body.bulk_options.format,
            generatedBy: user.full_name,
          }
        );

        return NextResponse.json(bulkResult);
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get report template
async function getReportTemplate(
  supabase: SupabaseClient,
  templateId: string,
  templateType: string
) {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', templateId)
    .eq('type', templateType)
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data;
}
