import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, managementUnit, employeeId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use service role client for admin operations
    const supabaseAdmin = createServerSupabaseClient();

    // Prepare update data
    const updateData: Record<string, string> = {};

    if (fullName !== undefined) updateData.full_name = fullName;
    if (managementUnit !== undefined)
      updateData.management_unit = managementUnit;
    if (employeeId !== undefined) updateData.employee_id = employeeId;

    // Update user profile using email
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    const supabaseAdmin = createServerSupabaseClient();

    // Get user profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, email, full_name, role, employee_id, management_unit, phone_number, created_at'
      )
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
