import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/test-connection';

export async function GET() {
  try {
    const result = await testDatabaseConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        details: result.details,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test database connection',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
