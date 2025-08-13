import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'admin';
  employee_id: string;
  management_unit: string;
  phone_number?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'momo' | 'controller' | 'interest';
  transaction_date: Date;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
}

export interface Statement {
  id: string;
  user_id: string;
  month: number;
  year: number;
  opening_balance: number;
  closing_balance: number;
  total_contributions: number;
  total_interest: number;
  generated_at: Date;
  download_url?: string;
}

export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  employee_id: string;
  management_unit: string;
  phone_number?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  last_login?: Date;
}

export interface Report {
  id: string;
  filename: string;
  uploaded_by: string;
  uploaded_at: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  error_count: number;
}

export interface SystemStats {
  total_teachers: number;
  active_teachers: number;
  total_savings: number;
  monthly_contributions: number;
  pending_reports: number;
  system_health: 'good' | 'warning' | 'error';
}

// App State Store
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      user: null,
      theme: 'light',
      notifications: [],
      loading: false,
      error: null,

      setUser: user => set({ user }),
      setTheme: theme => set({ theme }),
      addNotification: notification => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
        };
        set(state => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },
      removeNotification: id =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),
      markNotificationAsRead: id =>
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      setLoading: loading => set({ loading }),
      setError: error => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'app-storage',
      partialize: state => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  )
);

// Teacher State Store
interface TeacherState {
  balance: number;
  transactions: Transaction[];
  statements: Statement[];
  loading: boolean;
  error: string | null;

  // Actions
  setBalance: (balance: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setStatements: (statements: Statement[]) => void;
  addStatement: (statement: Statement) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useTeacherStore = create<TeacherState>()(set => ({
  balance: 0,
  transactions: [],
  statements: [],
  loading: false,
  error: null,

  setBalance: balance => set({ balance }),
  setTransactions: transactions => set({ transactions }),
  addTransaction: transaction =>
    set(state => ({
      transactions: [transaction, ...state.transactions],
    })),
  setStatements: statements => set({ statements }),
  addStatement: statement =>
    set(state => ({
      statements: [statement, ...state.statements],
    })),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      balance: 0,
      transactions: [],
      statements: [],
      loading: false,
      error: null,
    }),
}));

// Admin State Store
interface AdminState {
  teachers: Teacher[];
  reports: Report[];
  systemStats: SystemStats;
  loading: boolean;
  error: string | null;

  // Actions
  setTeachers: (teachers: Teacher[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  removeTeacher: (id: string) => void;
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  setSystemStats: (stats: SystemStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>()(set => ({
  teachers: [],
  reports: [],
  systemStats: {
    total_teachers: 0,
    active_teachers: 0,
    total_savings: 0,
    monthly_contributions: 0,
    pending_reports: 0,
    system_health: 'good',
  },
  loading: false,
  error: null,

  setTeachers: teachers => set({ teachers }),
  addTeacher: teacher =>
    set(state => ({
      teachers: [teacher, ...state.teachers],
    })),
  updateTeacher: (id, updates) =>
    set(state => ({
      teachers: state.teachers.map(teacher =>
        teacher.id === id ? { ...teacher, ...updates } : teacher
      ),
    })),
  removeTeacher: id =>
    set(state => ({
      teachers: state.teachers.filter(teacher => teacher.id !== id),
    })),
  setReports: reports => set({ reports }),
  addReport: report =>
    set(state => ({
      reports: [report, ...state.reports],
    })),
  updateReport: (id, updates) =>
    set(state => ({
      reports: state.reports.map(report =>
        report.id === id ? { ...report, ...updates } : report
      ),
    })),
  setSystemStats: systemStats => set({ systemStats }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      teachers: [],
      reports: [],
      systemStats: {
        total_teachers: 0,
        active_teachers: 0,
        total_savings: 0,
        monthly_contributions: 0,
        pending_reports: 0,
        system_health: 'good',
      },
      loading: false,
      error: null,
    }),
}));

// Session Management Store
interface SessionState {
  isAuthenticated: boolean;
  sessionToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;

  // Actions
  setSession: (token: string, refreshToken: string, expiresAt: Date) => void;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  isAuthenticated: false,
  sessionToken: null,
  refreshToken: null,
  expiresAt: null,

  setSession: (token, refreshToken, expiresAt) =>
    set({
      isAuthenticated: true,
      sessionToken: token,
      refreshToken,
      expiresAt,
    }),
  clearSession: () =>
    set({
      isAuthenticated: false,
      sessionToken: null,
      refreshToken: null,
      expiresAt: null,
    }),
  refreshSession: () => {
    // This will be implemented with Supabase auth refresh
    const { refreshToken } = get();
    if (refreshToken) {
      // Implement token refresh logic here
    }
    return Promise.resolve();
  },
}));

// Export all stores for easy access
export const stores = {
  app: useAppStore,
  teacher: useTeacherStore,
  admin: useAdminStore,
  session: useSessionStore,
};
