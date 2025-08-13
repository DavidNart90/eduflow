import { createClient } from '@supabase/supabase-js';

export interface TableCheckResult {
  tableName: string;
  exists: boolean;
  error?: string;
  rowCount?: number;
}

export interface DatabaseCheckResult {
  success: boolean;
  tables: TableCheckResult[];
  missingTables: string[];
  existingTables: string[];
  summary: string;
}

export async function checkDatabaseTables(): Promise<DatabaseCheckResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      tables: [],
      missingTables: [
        'users',
        'savings_transactions',
        'controller_reports',
        'email_notifications',
      ],
      existingTables: [],
      summary: 'Missing Supabase environment variables',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const requiredTables = [
      'users',
      'savings_transactions',
      'controller_reports',
      'email_notifications',
    ];
    const tableResults: TableCheckResult[] = [];
    const missingTables: string[] = [];
    const existingTables: string[] = [];

    // Check each required table
    for (const tableName of requiredTables) {
      try {
        // Try to query the table to see if it exists
        const { error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // If we get a specific error about the table not existing
          if (error.code === '42P01') {
            // PostgreSQL error code for undefined_table
            tableResults.push({
              tableName,
              exists: false,
              error: 'Table does not exist',
            });
            missingTables.push(tableName);
          } else {
            tableResults.push({
              tableName,
              exists: false,
              error: error.message,
            });
            missingTables.push(tableName);
          }
        } else {
          tableResults.push({
            tableName,
            exists: true,
            rowCount: count || 0,
          });
          existingTables.push(tableName);
        }
      } catch (err) {
        tableResults.push({
          tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        missingTables.push(tableName);
      }
    }

    const allTablesExist = missingTables.length === 0;
    const summary = allTablesExist
      ? `✅ All ${requiredTables.length} required tables exist in the database`
      : `❌ ${missingTables.length} out of ${requiredTables.length} required tables are missing: ${missingTables.join(', ')}`;

    return {
      success: allTablesExist,
      tables: tableResults,
      missingTables,
      existingTables,
      summary,
    };
  } catch (error) {
    return {
      success: false,
      tables: [],
      missingTables: [
        'users',
        'savings_transactions',
        'controller_reports',
        'email_notifications',
      ],
      existingTables: [],
      summary: `Failed to check database tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Function to check if specific tables exist
export async function checkSpecificTable(
  tableName: string
): Promise<TableCheckResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      tableName,
      exists: false,
      error: 'Missing Supabase environment variables',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        tableName,
        exists: false,
        error: error.message,
      };
    }

    return {
      tableName,
      exists: true,
      rowCount: count || 0,
    };
  } catch (error) {
    return {
      tableName,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
