import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { TeacherFinancialReportPDF } from '@/lib/reports/teacher-financial-pdf';
import { createAdminReportNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Check if user is admin - lookup by email since auth ID might differ from users table ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacher_id, start_date, end_date, format = 'pdf' } = body;

    // Validate required fields
    if (!teacher_id) {
      return NextResponse.json(
        { error: 'teacher_id is required' },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select(
        'id, full_name, employee_id, email, management_unit, phone_number, created_at'
      )
      .eq('id', teacher_id)
      .eq('role', 'teacher')
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Generate the report data using the database function
    const rpcParams: {
      teacher_id: string;
      start_date?: string;
      end_date?: string;
    } = { teacher_id };

    if (start_date) {
      rpcParams.start_date = start_date;
    }
    if (end_date) {
      rpcParams.end_date = end_date;
    }

    const { data: reportData, error: reportError } = await supabase.rpc(
      'generate_teacher_financial_report_data',
      rpcParams
    );

    if (reportError) {
      return NextResponse.json(
        {
          error: 'Failed to generate report data',
          details: reportError.message,
        },
        { status: 500 }
      );
    }

    if (!reportData) {
      return NextResponse.json(
        { error: 'No data available for report generation' },
        { status: 404 }
      );
    }

    if (format === 'json') {
      // Return raw data for preview or other processing
      return NextResponse.json({
        success: true,
        data: reportData,
        teacher: teacher,
      });
    }

    // Generate PDF
    const pdfGenerator = new TeacherFinancialReportPDF();
    const buffer = pdfGenerator.getReportBuffer(reportData);

    // Create filename
    const filename = `${teacher.full_name.replace(/\s+/g, '_')}_Financial_Statement_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;

    // Log the generated report to the database
    let reportId: string | null = null;
    try {
      // Get the database user ID by email (same approach as admin check)
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!dbUser) {
        // Database user not found for email - still generate the PDF, just skip logging
      } else {
        // Logging report with database user ID
        const logResult = await supabase.rpc('log_generated_report', {
          p_report_type: 'teacher_statement',
          p_file_name: filename,
          p_file_url: `/api/admin/generated-reports/${reportId}/download`, // Will be updated after insert
          p_file_size: buffer.byteLength,
          p_generation_params: {
            teacher_id,
            start_date: start_date || null,
            end_date: end_date || null,
            format: 'pdf',
          },
          p_teacher_id: teacher_id,
          p_generated_by: dbUser.id, // Use database user ID instead of Auth user ID
        });
        // Log result
        reportId = logResult.data?.report_id;
      }
    } catch {
      // Don't fail the request if logging fails
    }

    // Create notifications for teacher and admins
    try {
      const reportPeriod =
        start_date && end_date
          ? `${new Date(start_date).toLocaleDateString('en-GB')} - ${new Date(end_date).toLocaleDateString('en-GB')}`
          : 'All Time';

      // Notify the teacher about the report
      await createAdminReportNotification(
        teacher_id,
        {
          report_type: 'Financial Statement',
          report_period: reportPeriod,
          report_id: reportId || undefined,
        },
        undefined
      );
      // eslint-disable-next-line no-console
      console.log(
        `Created report notification for teacher ${teacher.full_name}`
      );
    } catch (notificationError) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to create report generation notifications:',
        notificationError
      );
    }

    // Return success response with detailed report information
    return NextResponse.json({
      success: true,
      message: `Financial statement for ${teacher.full_name} has been generated successfully`,
      report: {
        id: reportId,
        file_name: filename,
        file_size: buffer.byteLength,
        teacher_name: teacher.full_name,
        teacher_id: teacher_id,
        generated_at: new Date().toISOString(),
        period: {
          start_date: start_date || 'All time',
          end_date: end_date || 'Present',
        },
      },
      toast: {
        type: 'success',
        title: 'Report Generated',
        message: `Financial statement for ${teacher.full_name} is ready for download`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available teachers for report generation
export async function GET(request: NextRequest) {
  try {
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
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Check if user is admin - lookup by email since auth ID might differ from users table ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all teachers with their basic financial info
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_balances')
      .select('*')
      .order('full_name');

    if (teachersError) {
      return NextResponse.json(
        { error: 'Failed to fetch teachers', details: teachersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teachers: teachers || [],
      count: teachers?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
