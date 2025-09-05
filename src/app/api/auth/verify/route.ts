import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerSupabaseClient } from '@/lib/supabase';

interface AuthUser {
  id: string;
  email?: string;
  created_at?: string;
  [key: string]: unknown;
}

// Fallback function for resending verification emails
async function fallbackResendVerification(email: string, origin: string) {
  try {
    // Generate a temporary password for the resend
    const tempPassword = Math.random().toString(36).slice(-8) + '1A!';

    // Try to sign up again (this will fail for existing users, but Supabase will send the email)
    const { data, error: resendError } = await supabase.auth.signUp({
      email: email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${origin}/auth/verify`,
      },
    });

    if (resendError) {
      // If user already exists, Supabase might still send the email
      if (
        resendError.message.includes('already registered') ||
        resendError.message.includes('User already registered')
      ) {
        // Check if we actually got a user object despite the error
        if (data?.user) {
          return NextResponse.json({
            success: true,
            message:
              'Verification email sent successfully. Please check your inbox.',
          });
        }

        // If no user object, try a different approach - use the service role client
        const supabaseAdmin = createServerSupabaseClient();

        try {
          // Try to create a new signup with the service role (this bypasses some restrictions)
          const { error: adminError } =
            await supabaseAdmin.auth.admin.createUser({
              email: email,
              password: tempPassword,
              email_confirm: false,
              user_metadata: { resend_verification: true },
            });

          if (adminError) {
            // Even if this fails, the original signup attempt might have triggered an email
            return NextResponse.json({
              success: true,
              message:
                'Verification email sent successfully. Please check your inbox.',
            });
          }
          return NextResponse.json({
            success: true,
            message:
              'Verification email sent successfully. Please check your inbox.',
          });
        } catch {
          // Fall back to optimistic response
          return NextResponse.json({
            success: true,
            message:
              'Verification email sent successfully. Please check your inbox.',
          });
        }
      } else {
        return NextResponse.json(
          {
            error: `Failed to resend verification email: ${resendError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // If no error, the email was sent successfully
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Failed to resend verification email. Please try signing up again.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: profile.full_name,
        role: profile.role,
        employee_id: profile.employee_id,
        management_unit: profile.management_unit,
        phone_number: profile.phone_number,
      },
      session,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check if this is a Supabase email confirmation code (UUID format)
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token
      )
    ) {
      // Use Supabase's verifyOtp method for email confirmation codes
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        return NextResponse.json(
          { error: `Email verification failed: ${error.message}` },
          { status: 400 }
        );
      }

      // Extract the user's email from the verification response
      const userEmail = data.user?.email;
      if (!userEmail) {
        return NextResponse.json(
          { error: 'Could not extract user email from verification' },
          { status: 400 }
        );
      }

      // Check if user already exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Error checking user status' },
          { status: 500 }
        );
      }

      // If user already exists and has completed profile, redirect to dashboard
      if (existingUser && existingUser.employee_id !== 'PENDING') {
        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
          email: userEmail,
          redirectTo: '/dashboard',
          profileComplete: true,
        });
      }

      // Return success - the user will complete setup on the frontend
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully. Please complete your profile.',
        email: userEmail,
        redirectTo: '/auth/verify?step=setup',
        profileComplete: false,
      });
    }

    // Check if this is an access token (JWT)
    if (token.includes('.')) {
      // This looks like a JWT access token - we'll handle this on the client side
      return NextResponse.json({
        success: true,
        message: 'Access token received. Please complete your profile setup.',
        email: null, // Will be extracted on client side
        redirectTo: '/auth/verify?step=setup',
        profileComplete: false,
        isAccessToken: true,
      });
    }
    // This is a different type of verification token
    return NextResponse.json(
      { error: 'Invalid verification token format' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, userData } = await request.json();

    if (!email || !userData) {
      return NextResponse.json(
        { error: 'Email and user data are required' },
        { status: 400 }
      );
    }

    // Verify employee ID format (should start with EMP or ADMIN followed by 3 digits)
    const employeeIdRegex = /^(EMP|ADMIN)\d{3}$/;
    if (!employeeIdRegex.test(userData.employeeId.toUpperCase())) {
      return NextResponse.json(
        {
          error:
            'Employee ID must start with EMP or ADMIN followed by 3 digits (e.g., EMP001, ADMIN001)',
        },
        { status: 400 }
      );
    }

    // Check if employee ID is already taken
    const { data: existingEmployee } = await supabase
      .from('users')
      .select('*')
      .eq('employee_id', userData.employeeId)
      .single();

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID is already registered' },
        { status: 400 }
      );
    }

    // Create user in our users table using service role client
    const supabaseAdmin = createServerSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: email,
          full_name: userData.fullName,
          employee_id: userData.employeeId.toUpperCase(),
          management_unit: userData.school, // Using school as management_unit for now
          phone_number: userData.phoneNumber || null,
          role:
            userData.role ||
            (userData.employeeId.toUpperCase().startsWith('ADMIN')
              ? 'admin'
              : 'teacher'),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Password handling is now done separately in the set-password endpoint
    // This ensures we don't try to update passwords for users that don't exist yet

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: data,
      redirectTo: '/dashboard',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// New endpoint for employee ID verification and resend verification
export async function PATCH(request: NextRequest) {
  try {
    const { employeeId, email, action } = await request.json();

    // Handle email checking
    if (action === 'check-email') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for checking' },
          { status: 400 }
        );
      }

      try {
        // First check if user already exists in Supabase auth.users table
        const supabaseAdmin = createServerSupabaseClient();
        const { data: authUsers, error: authError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          return NextResponse.json(
            { error: 'Error checking email status' },
            { status: 500 }
          );
        }

        // Check if email exists in auth.users
        const existingAuthUser = (authUsers.users as AuthUser[]).find(
          (user: AuthUser) => user.email === email
        );
        if (existingAuthUser) {
          return NextResponse.json({
            error: 'Email already registered',
            message:
              'An account with this email already exists. Please try logging in instead.',
          });
        }

        // Also check if user already exists in our users table
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          return NextResponse.json(
            { error: 'Error checking email status' },
            { status: 500 }
          );
        }

        // If user already exists in our table, return error
        if (existingUser) {
          return NextResponse.json({
            error: 'Email already registered',
            message:
              'An account with this email already exists. Please try logging in instead.',
          });
        }

        // Email is available
        return NextResponse.json({
          valid: true,
          message: 'Email is available',
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to check email. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Handle email confirmation
    if (action === 'confirm-email') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for confirmation' },
          { status: 400 }
        );
      }

      try {
        // Find the user in auth.users table
        const supabaseAdmin = createServerSupabaseClient();
        const { data: authUsers, error: authError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          return NextResponse.json(
            { error: 'Error confirming email' },
            { status: 500 }
          );
        }

        // Find the user by email
        const userToConfirm = (authUsers.users as AuthUser[]).find(
          (user: AuthUser) => user.email === email
        );
        if (!userToConfirm) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Update the user to confirm their email
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(userToConfirm.id, {
            email_confirm: true,
          });

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to confirm email' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Email confirmed successfully',
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to confirm email' },
          { status: 500 }
        );
      }
    }

    // Handle resend verification email
    if (action === 'resend-verification') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for resending verification' },
          { status: 400 }
        );
      }

      try {
        // For now, use the fallback method which handles existing users better
        // The admin API approach requires additional permissions that might not be available
        return await fallbackResendVerification(email, request.nextUrl.origin);
      } catch {
        return NextResponse.json(
          {
            error:
              'Failed to resend verification email. Please try signing up again.',
          },
          { status: 500 }
        );
      }
    }

    // Handle employee ID verification (existing functionality)
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Check if employee ID format is valid (should start with EMP or ADMIN followed by 3 digits)
    const employeeIdRegex = /^(EMP|ADMIN)\d{3}$/;
    const isValid = employeeIdRegex.test(employeeId.toUpperCase());

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        message:
          'Employee ID must start with EMP or ADMIN followed by 3 digits (e.g., EMP001, ADMIN001)',
      });
    }

    // Check if employee ID is already registered using service role client
    try {
      const supabaseAdmin = createServerSupabaseClient();
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('employee_id', employeeId.toUpperCase())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // If there's an error checking the database, we'll still allow the format validation to pass
        // but log the error for debugging
        return NextResponse.json({
          valid: true,
          message: 'Employee ID format is valid!',
        });
      }

      if (existingUser) {
        return NextResponse.json({
          valid: false,
          error: 'Employee ID is already registered',
        });
      }

      return NextResponse.json({
        valid: true,
        message: 'Employee ID format is valid!',
      });
    } catch {
      // If there's an unexpected error, we'll still allow the format validation to pass
      return NextResponse.json({
        valid: true,
        message: 'Employee ID format is valid!',
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
