/**
 * CPU Optimization Utilities for Eduflow
 * Implements strategies to reduce CPU usage through intelligent scheduling
 */

import { useRef, useEffect, useCallback } from 'react';

// Extend Window interface for performance monitor
declare global {
  interface Window {
    performanceMonitor?: {
      pause?: () => void;
      resume?: () => void;
    };
  }
}

class CPUOptimizer {
  private static instance: CPUOptimizer;
  private activeIntervals = new Set<NodeJS.Timeout>();
  private activeTimeouts = new Set<NodeJS.Timeout>();
  private isPageVisible = true;
  private networkStatus: 'online' | 'offline' = 'online';

  static getInstance(): CPUOptimizer {
    if (!CPUOptimizer.instance) {
      CPUOptimizer.instance = new CPUOptimizer();
    }
    return CPUOptimizer.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupVisibilityHandling();
      this.setupNetworkHandling();
    }
  }

  // Monitor page visibility to pause expensive operations
  private setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;

      if (this.isPageVisible) {
        this.resumeOptimizedOperations();
      } else {
        this.pauseNonCriticalOperations();
      }
    });
  }

  // Monitor network status
  private setupNetworkHandling() {
    window.addEventListener('online', () => {
      this.networkStatus = 'online';
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline';
    });
  }

  // Intelligent interval management with adaptive frequency
  createAdaptiveInterval(
    callback: () => void | Promise<void>,
    baseInterval: number,
    options: {
      pauseWhenHidden?: boolean;
      skipWhenOffline?: boolean;
      maxInterval?: number;
      backoffMultiplier?: number;
    } = {}
  ): NodeJS.Timeout {
    const {
      pauseWhenHidden = true,
      skipWhenOffline = true,
      maxInterval = baseInterval * 5,
      backoffMultiplier = 1.5,
    } = options;

    let currentInterval = baseInterval;
    let consecutiveErrors = 0;

    const adaptiveCallback = async () => {
      // Skip if page is hidden and configured to pause
      if (pauseWhenHidden && !this.isPageVisible) {
        return;
      }

      // Skip if offline and configured to skip
      if (skipWhenOffline && this.networkStatus === 'offline') {
        return;
      }

      try {
        await callback();
        // Reset interval on success
        if (consecutiveErrors > 0) {
          consecutiveErrors = 0;
          currentInterval = baseInterval;
        }
      } catch (error) {
        consecutiveErrors++;
        // Exponential backoff on errors
        currentInterval = Math.min(
          currentInterval * backoffMultiplier,
          maxInterval
        );

        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `Adaptive interval error (${consecutiveErrors}):`,
            error
          );
        }
      }
    };

    const intervalId = setInterval(adaptiveCallback, currentInterval);
    this.activeIntervals.add(intervalId);

    return intervalId;
  }

  // Optimized timeout with request animation frame
  createOptimizedTimeout(
    callback: () => void,
    delay: number,
    useRAF = false
  ): NodeJS.Timeout {
    if (useRAF && typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          callback();
          this.activeTimeouts.delete(timeoutId);
        });
      }, delay) as NodeJS.Timeout;

      this.activeTimeouts.add(timeoutId);
      return timeoutId;
    }

    const timeoutId = setTimeout(() => {
      callback();
      this.activeTimeouts.delete(timeoutId);
    }, delay);

    this.activeTimeouts.add(timeoutId);
    return timeoutId;
  }

  // Batched API calls to reduce CPU overhead
  private pendingApiCalls = new Map<
    string,
    {
      callbacks: Array<(result: any) => void>;
      timeout: NodeJS.Timeout;
    }
  >();

  batchApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay = 100
  ): Promise<T> {
    return new Promise(resolve => {
      const existing = this.pendingApiCalls.get(key);

      if (existing) {
        // Add to existing batch
        existing.callbacks.push(resolve);
      } else {
        // Create new batch
        const timeout = this.createOptimizedTimeout(async () => {
          const batch = this.pendingApiCalls.get(key);
          if (!batch) return;

          this.pendingApiCalls.delete(key);

          try {
            const result = await apiCall();
            batch.callbacks.forEach(callback => callback(result));
          } catch (error) {
            // For batched calls, we pass the error as a resolved value
            // since each callback handles its own error state
            batch.callbacks.forEach(callback => callback(error));
          }
        }, delay);

        this.pendingApiCalls.set(key, {
          callbacks: [resolve],
          timeout,
        });
      }
    });
  }

  // Throttled polling with exponential backoff
  createThrottledPoll(
    pollFunction: () => Promise<boolean>,
    options: {
      initialInterval?: number;
      maxInterval?: number;
      maxAttempts?: number;
      backoffMultiplier?: number;
    } = {}
  ): {
    start: () => void;
    stop: () => void;
    isRunning: () => boolean;
  } {
    const {
      initialInterval = 1000,
      maxInterval = 30000,
      maxAttempts = 50,
      backoffMultiplier = 1.5,
    } = options;

    let currentInterval = initialInterval;
    let attempts = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let isActive = false;

    const poll = async () => {
      if (!isActive) return;

      try {
        const shouldContinue = await pollFunction();

        if (!shouldContinue || attempts >= maxAttempts) {
          isActive = false;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          return;
        }

        attempts++;
        // Gradually increase interval to reduce CPU load
        currentInterval = Math.min(
          currentInterval * backoffMultiplier,
          maxInterval
        );

        if (isActive) {
          timeoutId = this.createOptimizedTimeout(poll, currentInterval);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Throttled poll error:', error);
        }

        attempts++;
        currentInterval = Math.min(currentInterval * 2, maxInterval);

        if (isActive && attempts < maxAttempts) {
          timeoutId = this.createOptimizedTimeout(poll, currentInterval);
        }
      }
    };

    return {
      start: () => {
        if (isActive) return;

        isActive = true;
        attempts = 0;
        currentInterval = initialInterval;
        poll();
      },
      stop: () => {
        isActive = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      isRunning: () => isActive,
    };
  }

  // Pause non-critical operations when page is hidden
  private pauseNonCriticalOperations() {
    // Performance monitoring should be paused
    if (typeof window !== 'undefined' && window.performanceMonitor) {
      window.performanceMonitor.pause?.();
    }
  }

  // Resume operations when page becomes visible
  private resumeOptimizedOperations() {
    // Resume performance monitoring
    if (typeof window !== 'undefined' && window.performanceMonitor) {
      window.performanceMonitor.resume?.();
    }
  }

  // Cleanup all managed timers
  cleanup() {
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingApiCalls.forEach(({ timeout }) => clearTimeout(timeout));

    this.activeIntervals.clear();
    this.activeTimeouts.clear();
    this.pendingApiCalls.clear();
  }

  // Get CPU optimization stats
  getStats() {
    return {
      activeIntervals: this.activeIntervals.size,
      activeTimeouts: this.activeTimeouts.size,
      pendingApiCalls: this.pendingApiCalls.size,
      isPageVisible: this.isPageVisible,
      networkStatus: this.networkStatus,
    };
  }
}

// Export singleton instance
export const cpuOptimizer = CPUOptimizer.getInstance();

// React hooks for CPU optimization
export function useAdaptiveInterval(
  callback: () => void | Promise<void>,
  interval: number,
  options?: Parameters<CPUOptimizer['createAdaptiveInterval']>[2]
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = cpuOptimizer.createAdaptiveInterval(
        () => callbackRef.current(),
        interval,
        options
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, options]);
}

export function useThrottledPoll(
  pollFunction: () => Promise<boolean>,
  options?: Parameters<CPUOptimizer['createThrottledPoll']>[1]
) {
  const pollRef = useRef(pollFunction);
  const controllerRef = useRef<ReturnType<
    CPUOptimizer['createThrottledPoll']
  > | null>(null);

  // Update poll function ref
  useEffect(() => {
    pollRef.current = pollFunction;
  }, [pollFunction]);

  useEffect(() => {
    controllerRef.current = cpuOptimizer.createThrottledPoll(
      () => pollRef.current(),
      options
    );

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
      }
    };
  }, [options]);

  return controllerRef.current;
}

// Hook for batched API calls
export function useBatchedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  delay = 100
) {
  const apiCallRef = useRef(apiCall);

  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  return useCallback(
    () => cpuOptimizer.batchApiCall(key, () => apiCallRef.current(), delay),
    [key, delay]
  );
}

// Cleanup on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cpuOptimizer.cleanup();
  });
}
