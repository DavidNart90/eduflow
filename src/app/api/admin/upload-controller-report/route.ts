import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface ControllerReportRow {
  employeeNo: string;
  employeeName: string;
  monthlyDeduction: number;
  managementUnit: string;
}

interface Teacher {
  id: string;
  full_name: string;
  management_unit: string;
  employee_id: string;
}

interface ProcessingResult {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  processedTransactions: number;
  errors: string[];
  warnings: string[];
  matchedTeachers: Array<{
    name: string;
    amount: number;
    managementUnit: string;
  }>;
  unmatchedTeachers: Array<{
    name: string;
    amount: number;
    managementUnit: string;
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
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
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create a server-side Supabase client
    const supabaseAdmin = createServerSupabaseClient();

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = formData.get('month') as string;
    const year = formData.get('year') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only CSV and Excel files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Check if report for this month/year already exists
    const { data: existingReport } = await supabaseAdmin
      .from('controller_reports')
      .select('id')
      .eq('report_month', parseInt(month))
      .eq('report_year', parseInt(year))
      .single();

    if (existingReport) {
      return NextResponse.json(
        {
          error: `A report for ${getMonthName(parseInt(month))} ${year} already exists. Please delete the existing report first or choose a different month.`,
        },
        { status: 409 }
      );
    }

    // Read and parse the file
    const arrayBuffer = await file.arrayBuffer();
    const data = parseSpreadsheet(arrayBuffer);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the file' },
        { status: 400 }
      );
    }

    // Get all teachers from database for matching
    const { data: teachers, error: teachersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, management_unit, employee_id')
      .eq('role', 'teacher');

    if (teachersError) {
      return NextResponse.json(
        { error: 'Failed to fetch teachers for matching' },
        { status: 500 }
      );
    }

    // Process the data and match with teachers
    const result = await processControllerData(
      data,
      teachers || [],
      supabaseAdmin,
      parseInt(month),
      parseInt(year)
    );

    // Create the controller report record
    const { data: reportRecord, error: reportError } = await supabaseAdmin
      .from('controller_reports')
      .insert({
        report_month: parseInt(month),
        report_year: parseInt(year),
        file_name: file.name,
        file_url: `uploads/controller-reports/${year}/${month}/${file.name}`, // This would be actual file storage URL
        uploaded_by: user.id,
        status: result.errors.length > 0 ? 'failed' : 'processed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportError) {
      // Continue anyway, as the transactions were processed
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed controller report for ${getMonthName(parseInt(month))} ${year}`,
      result,
      reportId: reportRecord?.id,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseSpreadsheet(arrayBuffer: ArrayBuffer): ControllerReportRow[] {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      throw new Error(
        'File must contain at least a header row and one data row'
      );
    }

    // Find the header row and identify columns
    let headerRowIndex = -1;
    let nameColIndex = -1;
    let deductionColIndex = -1;
    let managementUnitColIndex = -1;
    let employeeNoColIndex = -1;

    // Look for header row (first few rows)
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i] as string[];
      if (row && row.length > 0) {
        // Check for common header patterns
        for (let j = 0; j < row.length; j++) {
          const cell = row[j]?.toString().toLowerCase() || '';

          if (
            cell.includes('name') &&
            cell.includes('employee') &&
            nameColIndex === -1
          ) {
            nameColIndex = j;
            headerRowIndex = i;
          } else if (
            (cell.includes('monthly') ||
              cell.includes('deduction') ||
              cell.includes('amount')) &&
            deductionColIndex === -1
          ) {
            deductionColIndex = j;
            headerRowIndex = i;
          } else if (
            (cell.includes('management') ||
              cell.includes('unit') ||
              cell.includes('school')) &&
            managementUnitColIndex === -1
          ) {
            managementUnitColIndex = j;
            headerRowIndex = i;
          } else if (
            cell.includes('employee') &&
            cell.includes('no') &&
            employeeNoColIndex === -1
          ) {
            employeeNoColIndex = j;
            headerRowIndex = i;
          }
        }

        // If we found essential columns, break
        if (nameColIndex !== -1 && deductionColIndex !== -1) {
          break;
        }
      }
    }

    if (
      headerRowIndex === -1 ||
      nameColIndex === -1 ||
      deductionColIndex === -1
    ) {
      throw new Error(
        'Could not find required columns: Name of Employee and Monthly Deduction'
      );
    }

    const result: ControllerReportRow[] = [];

    // Process data rows
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] as string[];
      if (!row || row.length === 0) continue;

      const name = row[nameColIndex]?.toString().trim();
      const deductionStr = row[deductionColIndex]?.toString().trim();
      const managementUnit =
        managementUnitColIndex !== -1
          ? row[managementUnitColIndex]?.toString().trim()
          : '';
      const employeeNo =
        employeeNoColIndex !== -1
          ? row[employeeNoColIndex]?.toString().trim()
          : '';

      if (!name || !deductionStr) continue;

      // Parse deduction amount
      const deduction = parseFloat(deductionStr.replace(/[^\d.-]/g, ''));
      if (isNaN(deduction) || deduction <= 0) continue;

      result.push({
        employeeNo: employeeNo || '',
        employeeName: name,
        monthlyDeduction: deduction,
        managementUnit: managementUnit || '',
      });
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function processControllerData(
  reportData: ControllerReportRow[],
  teachers: Teacher[],
  supabaseAdmin: ReturnType<typeof createServerSupabaseClient>,
  month: number,
  year: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: reportData.length,
    matchedRecords: 0,
    unmatchedRecords: 0,
    processedTransactions: 0,
    errors: [],
    warnings: [],
    matchedTeachers: [],
    unmatchedTeachers: [],
  };

  const teacherMap = new Map(
    teachers.map(t => [t.employee_id.toLowerCase().trim(), t])
  );

  for (const row of reportData) {
    try {
      const directMatch =
        row.employeeNo && teacherMap.get(row.employeeNo.toLowerCase().trim());
      const matchedTeacher = directMatch || findMatchingTeacher(row, teachers);

      if (matchedTeacher) {
        // Create transaction for matched teacher
        const transactionDate = new Date(year, month - 1, 1)
          .toISOString()
          .split('T')[0];

        const { error: transactionError } = await supabaseAdmin
          .from('savings_transactions')
          .insert({
            user_id: matchedTeacher.id,
            transaction_type: 'controller',
            amount: row.monthlyDeduction,
            description: `Controller deduction for ${getMonthName(month)} ${year}`,
            transaction_date: transactionDate,
            status: 'completed',
            reference_id: `CTRL_${year}_${month.toString().padStart(2, '0')}_${matchedTeacher.employee_id}`,
            payment_method: 'controller',
          });

        if (transactionError) {
          result.errors.push(
            `Failed to create transaction for ${row.employeeName}: ${transactionError.message}`
          );
        } else {
          result.matchedRecords++;
          result.processedTransactions++;
          result.matchedTeachers.push({
            name: row.employeeName,
            amount: row.monthlyDeduction,
            managementUnit: row.managementUnit,
          });
        }
      } else {
        result.unmatchedRecords++;
        result.unmatchedTeachers.push({
          name: row.employeeName,
          amount: row.monthlyDeduction,
          managementUnit: row.managementUnit,
          reason: 'No matching teacher found in database',
        });
        result.warnings.push(
          `Could not match teacher: ${row.employeeName} (${row.managementUnit})`
        );
      }
    } catch (error) {
      result.errors.push(
        `Error processing ${row.employeeName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
}

function findMatchingTeacher(
  reportRow: ControllerReportRow,
  teachers: Teacher[]
): Teacher | null {
  const reportName = reportRow.employeeName.toLowerCase().trim();
  const reportUnit = reportRow.managementUnit.toLowerCase().trim();

  // First, try exact name match
  let bestMatch: Teacher | null =
    teachers.find(
      teacher => teacher.full_name.toLowerCase().trim() === reportName
    ) || null;

  if (bestMatch) {
    return bestMatch;
  }

  // Then try partial name matching with management unit consideration
  const nameWords = reportName.split(/\s+/);
  let bestScore = 0;

  for (const teacher of teachers) {
    const teacherName = teacher.full_name.toLowerCase().trim();
    const teacherUnit = teacher.management_unit.toLowerCase().trim();

    // Calculate name similarity score
    let nameScore = 0;
    const teacherWords = teacherName.split(/\s+/);

    // Count matching words
    for (const word of nameWords) {
      if (word.length > 2) {
        // Only consider words longer than 2 characters
        for (const teacherWord of teacherWords) {
          if (teacherWord.includes(word) || word.includes(teacherWord)) {
            nameScore++;
            break;
          }
        }
      }
    }

    // Normalize score
    nameScore = nameScore / Math.max(nameWords.length, teacherWords.length);

    // Bonus for management unit similarity (if available)
    let unitScore = 0;
    if (reportUnit && teacherUnit) {
      if (
        teacherUnit.includes(reportUnit) ||
        reportUnit.includes(teacherUnit)
      ) {
        unitScore = 0.3; // 30% bonus for unit match
      }
    }

    const totalScore = nameScore + unitScore;

    // Require at least 70% similarity for a match
    if (totalScore > 0.7 && totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = teacher;
    }
  }

  return bestMatch;
}

function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || 'Unknown';
}
