import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';
import { TeacherFinancialReportPDF } from '@/lib/reports/teacher-financial-pdf';
import JSZip from 'jszip';

interface GenerationParams {
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for database operations
    const supabaseAdmin = createServerSupabaseClient();

    // Check if user is admin
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single();

    if (dbUserError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get the report IDs from the request body
    const body = await request.json();
    const { reportIds } = body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'reportIds array is required' },
        { status: 400 }
      );
    }

    // Get all the reports
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('generated_reports')
      .select('*')
      .in('id', reportIds);

    if (reportsError || !reports || reports.length === 0) {
      return NextResponse.json({ error: 'No reports found' }, { status: 404 });
    }

    // Create a zip file
    const zip = new JSZip();
    let successCount = 0;
    const updatePromises: Promise<unknown>[] = [];

    // Process each report
    for (const report of reports) {
      try {
        let pdfBuffer: ArrayBuffer;

        if (report.report_type === 'teacher_statement') {
          // Get the teacher financial report data
          const params = report.generation_params as GenerationParams;
          const teacherId = params?.teacher_id;
          const startDate = params?.start_date;
          const endDate = params?.end_date;

          if (!teacherId) {
            // Skip reports with missing teacher ID
            continue;
          }

          // Call the same function that generates the original report
          const { data: reportData, error: dataError } =
            await supabaseAdmin.rpc('generate_teacher_financial_report_data', {
              teacher_id: teacherId,
              start_date: startDate,
              end_date: endDate,
            });

          if (dataError || !reportData) {
            // Skip reports that fail to generate data
            continue;
          }

          const pdfGenerator = new TeacherFinancialReportPDF();
          pdfBuffer = pdfGenerator.getReportBuffer(reportData);
        } else {
          // Skip unsupported report types
          continue;
        }

        // Add the PDF to the zip
        zip.file(report.file_name, pdfBuffer);
        successCount++;

        // Update download count for this report
        updatePromises.push(
          Promise.resolve(
            supabaseAdmin
              .from('generated_reports')
              .update({
                download_count: report.download_count + 1,
              })
              .eq('id', report.id)
          )
        );
      } catch {
        // Skip reports that fail to process
        continue;
      }
    }

    if (successCount === 0) {
      return NextResponse.json(
        { error: 'Failed to process any reports' },
        { status: 500 }
      );
    }

    // Execute all download count updates in parallel
    await Promise.allSettled(updatePromises);

    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const zipFileName = `reports_bulk_download_${timestamp}.zip`;

    // Return the zip file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
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
