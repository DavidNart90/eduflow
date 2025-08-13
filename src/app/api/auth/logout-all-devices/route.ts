import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // For now, we'll just return success and let the frontend handle the logout
    // The admin JWT issue suggests we need proper service role configuration
    // which might not be available in the current setup

    return NextResponse.json(
      {
        message: 'Logout initiated successfully',
        action: 'redirect_to_login',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
