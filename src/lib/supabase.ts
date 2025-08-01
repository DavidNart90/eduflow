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
  },
  db: {
    schema: 'public',
  },
});

// Server-side Supabase client with service role key
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

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
