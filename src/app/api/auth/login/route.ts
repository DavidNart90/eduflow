import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email/Employee ID is required' },
        { status: 400 }
      );
    }

    // Determine if identifier is email or employee ID
    const isEmail = identifier.includes('@');
    let email: string | null = null;
    let userData: {
      id: string;
      email: string;
      full_name: string;
      role: string;
      employee_id: string;
      management_unit: string;
      phone_number?: string;
    } | null = null;

    // Use service role client to query users table
    const supabaseAdmin = createServerSupabaseClient();

    if (isEmail) {
      // If it's an email, look up the user directly
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (!user) {
        // User doesn't exist in our database, but might exist in Supabase Auth
        // For password lookup, we'll still try to authenticate
        email = identifier.toLowerCase();
        userData = null;
      } else {
        email = user.email;
        userData = user;
      }
    } else {
      // If it's an employee ID, look up the user by employee_id
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('employee_id', identifier.toUpperCase())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Employee ID not found' },
          { status: 404 }
        );
      }

      email = user.email;
      userData = user;
    }

    // If no password provided, just return the user data for lookup
    if (!password) {
      if (!userData) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User found',
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          employee_id: userData.employee_id,
          management_unit: userData.management_unit,
          phone_number: userData.phone_number,
        },
      });
    }

    // Now authenticate with Supabase using the email
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData
        ? {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            employee_id: userData.employee_id,
            management_unit: userData.management_unit,
            phone_number: userData.phone_number,
          }
        : {
            id: authData.user?.id || '',
            email: email,
            full_name: email.split('@')[0],
            role: 'teacher',
            employee_id: 'PENDING',
            management_unit: 'PENDING',
            phone_number: null,
          },
      session: authData.session,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
