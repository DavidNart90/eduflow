import { createClient } from '@supabase/supabase-js';

export async function testDatabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      error: 'Missing Supabase environment variables',
      details: {
        url: Boolean(supabaseUrl),
        key: Boolean(supabaseAnonKey),
      },
    };
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test the connection by trying to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
        },
      };
    }

    return {
      success: true,
      data: data,
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
