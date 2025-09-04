import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';
import { TeacherFinancialReportPDF } from '@/lib/reports/teacher-financial-pdf';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Verify the token with the regular Supabase client
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        userEmail = user.email;
      } catch {
        return NextResponse.json(
          { error: 'Token verification failed' },
          { status: 401 }
        );
      }
    } else {
      // Fallback: try to get session from cookies
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        userEmail = session.user.email;
      } catch {
        return NextResponse.json(
          { error: 'Session retrieval failed' },
          { status: 401 }
        );
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Get the teacher's user ID from the database
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', userEmail)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check if user is a teacher (not admin)
    if (dbUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Use admin API for admin users' },
        { status: 403 }
      );
    }

    // Get the report details and verify ownership
    const { data: report, error: reportError } = await supabaseAdmin
      .from('generated_reports')
      .select('*')
      .eq('id', id)
      .eq('teacher_id', dbUser.id) // Ensure teacher can only access their own reports
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    // Generate the PDF based on the report parameters
    let pdfBuffer: ArrayBuffer;

    if (report.report_type === 'teacher_statement') {
      // Get the teacher financial report data
      const params = report.generation_params as {
        teacher_id?: string;
        start_date?: string;
        end_date?: string;
      };
      const teacherId = params?.teacher_id;
      const startDate = params?.start_date;
      const endDate = params?.end_date;

      if (!teacherId || teacherId !== dbUser.id) {
        // Teacher ID mismatch or missing in report params
        return NextResponse.json(
          {
            error: 'Invalid report parameters or access denied',
            details: 'You can only access your own reports',
            code: 'ACCESS_DENIED',
          },
          { status: 400 }
        );
      }

      // Call the same function that generates the original report
      const { data: reportData, error: dataError } = await supabaseAdmin.rpc(
        'generate_teacher_financial_report_data',
        {
          teacher_id: teacherId,
          start_date: startDate,
          end_date: endDate,
        }
      );

      if (dataError) {
        // RPC error during report generation
        return NextResponse.json(
          {
            error: 'Failed to generate report data',
            details: dataError.message,
            code: 'RPC_GENERATION_ERROR',
          },
          { status: 500 }
        );
      }

      if (!reportData) {
        // No report data returned from RPC
        return NextResponse.json(
          {
            error: 'No data available for report generation',
            details:
              'You may not have any transactions in the specified period',
            code: 'NO_REPORT_DATA',
          },
          { status: 404 }
        );
      }

      const pdfGenerator = new TeacherFinancialReportPDF();
      pdfBuffer = pdfGenerator.getReportBuffer(reportData);
    } else {
      return NextResponse.json(
        { error: 'Unsupported report type' },
        { status: 400 }
      );
    }

    // Update download count
    const { error: updateError } = await supabaseAdmin
      .from('generated_reports')
      .update({
        download_count: report.download_count + 1,
      })
      .eq('id', id);

    if (updateError) {
      // Failed to update download count - continue with download even if count update fails
    }

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.file_name}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (serverError) {
    // Error downloading teacher report
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          serverError instanceof Error
            ? serverError.message
            : 'Unknown server error',
        code: 'TEACHER_DOWNLOAD_ERROR',
      },
      { status: 500 }
    );
  }
}
