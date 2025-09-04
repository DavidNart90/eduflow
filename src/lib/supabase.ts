import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'eduflow-web',
    },
  },
  // Performance optimizations
  realtime: {
    // Disable realtime by default to reduce CPU usage
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Connection pool for server-side clients to prevent memory leaks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverClientPool: Array<{ client: any; created: number; used: boolean }> =
  [];
const MAX_POOL_SIZE = 5;
const CLIENT_TIMEOUT = 30000; // 30 seconds

// Cleanup function to remove stale connections
const cleanupServerPool = () => {
  const now = Date.now();
  serverClientPool = serverClientPool.filter(item => {
    const isStale = now - item.created > CLIENT_TIMEOUT;
    if (isStale && item.client) {
      // Properly close the connection
      try {
        if (item.client.realtime) {
          item.client.realtime.disconnect();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error closing connection:', error);
      }
    }
    return !isStale;
  });
};

// Server-side Supabase client with service role key - optimized for performance with connection pooling
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role environment variables');
  }

  // Clean up stale connections
  cleanupServerPool();

  // Try to reuse an existing client
  const availableClient = serverClientPool.find(item => !item.used);
  if (availableClient) {
    availableClient.used = true;
    // Mark as unused after 5 seconds
    setTimeout(() => {
      availableClient.used = false;
    }, 5000);
    return availableClient.client;
  }

  // Create new client if pool is not full
  if (serverClientPool.length < MAX_POOL_SIZE) {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      // Optimize for server-side usage
      global: {
        headers: {
          'X-Client-Info': 'eduflow-server',
        },
      },
      // Disable realtime for server components to reduce CPU usage
      realtime: {
        params: {
          eventsPerSecond: 1,
        },
      },
    });

    const poolItem = {
      client,
      created: Date.now(),
      used: true,
    };

    serverClientPool.push(poolItem);

    // Mark as unused after 5 seconds
    setTimeout(() => {
      poolItem.used = false;
    }, 5000);

    return client;
  }

  // Pool is full, create a temporary client
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'eduflow-server-temp',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  });
};

// Cleanup function to be called on app shutdown
export const cleanupSupabaseConnections = () => {
  serverClientPool.forEach(item => {
    try {
      if (item.client.realtime) {
        item.client.realtime.disconnect();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error closing connection:', error);
    }
  });
  serverClientPool = [];
};

// Run cleanup every 30 seconds
if (typeof window === 'undefined') {
  setInterval(cleanupServerPool, 30000);
}

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          employee_id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'admin';
          management_unit: string;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'admin';
          management_unit: string;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          email?: string;
          full_name?: string;
          role?: 'teacher' | 'admin';
          management_unit?: string;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'momo' | 'controller' | 'interest';
          amount: number;
          description: string;
          transaction_date: string;
          status: 'pending' | 'completed' | 'failed';
          reference_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'momo' | 'controller' | 'interest';
          amount: number;
          description: string;
          transaction_date?: string;
          status?: 'pending' | 'completed' | 'failed';
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'momo' | 'controller' | 'interest';
          amount?: number;
          description?: string;
          transaction_date?: string;
          status?: 'pending' | 'completed' | 'failed';
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      controller_reports: {
        Row: {
          id: string;
          report_month: number;
          report_year: number;
          file_name: string;
          file_url: string;
          uploaded_by: string;
          status: 'pending' | 'processed' | 'failed';
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_month: number;
          report_year: number;
          file_name: string;
          file_url: string;
          uploaded_by: string;
          status?: 'pending' | 'processed' | 'failed';
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_month?: number;
          report_year?: number;
          file_name?: string;
          file_url?: string;
          uploaded_by?: string;
          status?: 'pending' | 'processed' | 'failed';
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'statement' | 'payment_confirmation' | 'system';
          subject: string;
          content: string;
          sent_at: string | null;
          status: 'pending' | 'sent' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'statement' | 'payment_confirmation' | 'system';
          subject: string;
          content: string;
          sent_at?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'statement' | 'payment_confirmation' | 'system';
          subject?: string;
          content?: string;
          sent_at?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          created_at?: string;
        };
      };
    };
    Views: {
      teacher_balances: {
        Row: {
          user_id: string;
          total_balance: number;
          total_contributions: number;
          total_interest: number;
          last_transaction_date: string | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
