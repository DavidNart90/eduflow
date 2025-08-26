import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  validateReportRequest,
  GenerateReportRequest,
  createDefaultTeacherTemplate,
  createDefaultAssociationTemplate,
  TeacherStatementPDF,
  AssociationSummaryPDF,
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
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('email', user.email)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    let pdfBlob: Blob;
    let fileName: string;

    switch (body.type) {
      case 'teacher_statement': {
        if (!body.filters?.teacher_id) {
          return NextResponse.json(
            { error: 'Teacher ID required for teacher statements' },
            { status: 400 }
          );
        }

        // Fetch teacher data directly
        const teacherDataResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/teacher/data?teacher_id=${body.filters.teacher_id}${
            body.filters.start_date
              ? `&start_date=${body.filters.start_date}`
              : ''
          }${body.filters.end_date ? `&end_date=${body.filters.end_date}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!teacherDataResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch teacher data' },
            { status: 500 }
          );
        }

        const teacherData = await teacherDataResponse.json();

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

        // Generate PDF
        pdfBlob = await TeacherStatementPDF.generate(
          teacherData,
          teacherTemplate
        );
        fileName = `teacher_statement_${teacherData.teacher.employee_id}_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      }

      case 'association_summary': {
        // Fetch association data directly
        const associationParams = new URLSearchParams();
        if (body.filters?.start_date)
          associationParams.set('start_date', body.filters.start_date);
        if (body.filters?.end_date)
          associationParams.set('end_date', body.filters.end_date);

        // Determine quarter and year from filters
        if (body.filters?.end_date) {
          const endDate = new Date(body.filters.end_date);
          const year = endDate.getFullYear();
          const quarter = Math.ceil((endDate.getMonth() + 1) / 3);
          associationParams.set('quarter', quarter.toString());
          associationParams.set('year', year.toString());
        }

        const associationDataResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/association/data?${associationParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!associationDataResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch association data' },
            { status: 500 }
          );
        }

        const associationData = await associationDataResponse.json();

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

        // Generate PDF
        pdfBlob = await AssociationSummaryPDF.generate(
          associationData,
          associationTemplate
        );
        fileName = `association_summary_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported report type' },
          { status: 400 }
        );
    }

    // Return the PDF as a downloadable response
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBlob.size.toString(),
      },
    });
  } catch (error) {
    // Log error for debugging without console.error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
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
