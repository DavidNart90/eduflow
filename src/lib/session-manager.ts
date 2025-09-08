'use client';

/**
 * Session Manager - Handles auth session restoration and cache management
 * Prevents infinite loading states and provides fallback mechanisms
 */

export interface SessionInfo {
  userId: string;
  email: string;
  timestamp: number;
  isValid: boolean;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionKey = 'eduflow-session-info';
  private loadingCheckKey = 'eduflow-loading-check';
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Store session info for quick restoration
   */
  storeSessionInfo(userId: string, email: string): void {
    try {
      const sessionInfo: SessionInfo = {
        userId,
        email,
        timestamp: Date.now(),
        isValid: true,
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionInfo));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to store session info:', error);
    }
  }

  /**
   * Get stored session info if valid
   */
  getStoredSessionInfo(): SessionInfo | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;

      const sessionInfo: SessionInfo = JSON.parse(stored);
      const age = Date.now() - sessionInfo.timestamp;

      // Check if session is too old
      if (age > this.maxSessionAge) {
        this.clearSessionInfo();
        return null;
      }

      return sessionInfo;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to retrieve session info:', error);
      this.clearSessionInfo();
      return null;
    }
  }

  /**
   * Clear stored session info
   */
  clearSessionInfo(): void {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear session info:', error);
    }
  }

  /**
   * Clear all app caches and storage
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Reset our tracking keys
      this.sessionKey = 'eduflow-session-info';
      this.loadingCheckKey = 'eduflow-loading-check';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear all caches:', error);
    }
  }

  /**
   * Check if we're in a loading loop
   */
  isLoadingLoop(): boolean {
    const now = Date.now();

    try {
      const lastCheck = localStorage.getItem(this.loadingCheckKey);
      if (lastCheck) {
        const lastTime = parseInt(lastCheck, 10);
        // If we checked less than 30 seconds ago, we might be in a loop
        if (now - lastTime < 30000) {
          return true;
        }
      }

      localStorage.setItem(this.loadingCheckKey, now.toString());
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Reset loading loop detection
   */
  resetLoadingCheck(): void {
    try {
      localStorage.removeItem(this.loadingCheckKey);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to reset loading check:', error);
    }
  }
}

export const sessionManager = SessionManager.getInstance();
