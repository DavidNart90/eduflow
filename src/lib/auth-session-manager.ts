// Session Manager for handling auth state persistence and recovery
class AuthSessionManager {
  private static instance: AuthSessionManager;
  private loadingStartTime: number | null = null;
  private readonly MAX_LOADING_TIME = 8000; // 8 seconds max loading
  private readonly STORAGE_KEY = 'eduflow_auth_session';

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager();
    }
    return AuthSessionManager.instance;
  }

  // Track when loading starts
  startLoadingCheck(): void {
    this.loadingStartTime = Date.now();
  }

  // Check if loading has exceeded maximum time
  hasExceededMaxTime(): boolean {
    if (!this.loadingStartTime) return false;
    const elapsed = Date.now() - this.loadingStartTime;
    return elapsed > this.MAX_LOADING_TIME;
  }

  // Reset loading check
  resetLoadingCheck(): void {
    this.loadingStartTime = null;
  }

  // Store session info for quick recovery
  storeSessionInfo(sessionData: {
    userId: string;
    email: string;
    role: string;
    accessToken?: string;
  }): void {
    try {
      if (typeof window === 'undefined') return;

      const sessionInfo = {
        ...sessionData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionInfo));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to store session info:', error);
    }
  }

  // Get stored session info
  getStoredSessionInfo(): {
    userId: string;
    email: string;
    role: string;
    accessToken?: string;
    timestamp: number;
  } | null {
    try {
      if (typeof window === 'undefined') return null;

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const sessionInfo = JSON.parse(stored);

      // Check if expired
      if (Date.now() > sessionInfo.expiresAt) {
        this.clearSessionInfo();
        return null;
      }

      return sessionInfo;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to get stored session info:', error);
      return null;
    }
  }

  // Clear stored session info
  clearSessionInfo(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear session info:', error);
    }
  }

  // Check if we can use stored session for quick recovery
  canUseStoredSession(): boolean {
    const stored = this.getStoredSessionInfo();
    if (!stored) return false;

    // If stored session is less than 1 hour old, we can use it
    const age = Date.now() - stored.timestamp;
    return age < 60 * 60 * 1000; // 1 hour
  }

  // Force clear all auth-related storage (for cache clearing)
  clearAllAuthData(): void {
    try {
      if (typeof window === 'undefined') return;

      // Clear our session info
      this.clearSessionInfo();

      // Clear any other auth-related items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('sb-'))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // eslint-disable-next-line no-console
      console.log('Cleared all auth data from storage');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear auth data:', error);
    }
  }
}

export const sessionManager = AuthSessionManager.getInstance();
