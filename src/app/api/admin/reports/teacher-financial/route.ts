import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { TeacherFinancialReportPDF } from '@/lib/reports/teacher-financial-pdf';

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
    try {
      // Get the database user ID by email (same approach as admin check)
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!dbUser) {
        console.error('Database user not found for email:', user.email);
        // Still generate the PDF, just skip logging
      } else {
        console.log('Logging report with database user ID:', dbUser.id);
        const logResult = await supabase.rpc('log_generated_report', {
          p_report_type: 'teacher_statement',
          p_file_name: filename,
          p_file_url: `/api/admin/reports/teacher-financial/${teacher_id}`, // API endpoint reference
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
        console.log('Log result:', logResult);
      }
    } catch (logError) {
      // Don't fail the request if logging fails, just log the error
      console.error('Failed to log report generation:', logError);
    }

    // Return PDF as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
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
