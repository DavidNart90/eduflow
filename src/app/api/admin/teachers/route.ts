import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface Teacher {
  id: string;
  full_name: string;
  employee_id: string;
  management_unit: string;
  email: string;
  created_at: string;
}

interface TeacherBalance {
  user_id: string;
  total_contributions: number;
  total_interest: number;
  total_balance: number;
  last_transaction_date: string | null;
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, full_name, employee_id, management_unit, email, created_at')
      .eq('role', 'teacher')
      .order('full_name', { ascending: true });

    if (teachersError) {
      return NextResponse.json(
        { error: 'Failed to fetch teachers' },
        { status: 500 }
      );
    }

    // Get teacher balances to include in the response
    const { data: balances } = await supabase
      .from('teacher_balances')
      .select(
        'user_id, total_contributions, total_interest, total_balance, last_transaction_date'
      );

    // Merge teacher data with balances
    const teachersWithBalances = (teachers as Teacher[]).map(
      (teacher: Teacher) => {
        const balance = (balances as TeacherBalance[])?.find(
          (b: TeacherBalance) => b.user_id === teacher.id
        );
        return {
          ...teacher,
          current_balance: balance?.total_balance || 0,
          total_savings: balance?.total_contributions || 0,
          total_interest: balance?.total_interest || 0,
          last_transaction_date: balance?.last_transaction_date || null,
        };
      }
    );

    return NextResponse.json({
      teachers: teachersWithBalances,
      total: teachersWithBalances.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
