/**
 * Memory Monitoring and Optimization Utilities
 * Helps track and prevent memory leaks in the application
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any, class-methods-use-this, consistent-return */

interface MemoryStats {
  rss: number; // Resident Set Size
  heapUsed: number; // Heap used
  heapTotal: number; // Total heap
  external: number; // External memory
  timestamp: number;
}

interface MemoryThresholds {
  heapUsed: number; // MB
  rss: number; // MB
  leakDetectionWindow: number; // minutes
}

class MemoryMonitor {
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private callbacks: Array<(stats: MemoryStats) => void> = [];

  private readonly thresholds: MemoryThresholds = {
    heapUsed: 100, // 100MB
    rss: 200, // 200MB
    leakDetectionWindow: 5, // 5 minutes
  };

  constructor() {
    if (typeof window === 'undefined') {
      // Server-side only
      this.setupCleanupHandlers();
    }
  }

  private setupCleanupHandlers() {
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());
    }
  }

  startMonitoring(interval: number = 30000) {
    // 30 seconds default
    if (this.isMonitoring || typeof process === 'undefined') return;

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMemoryStats();
    }, interval);

    console.log(`📊 Memory monitoring started (interval: ${interval}ms)`);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('📊 Memory monitoring stopped');
  }

  private collectMemoryStats() {
    if (typeof process === 'undefined') return;

    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      timestamp: Date.now(),
    };

    this.memoryHistory.push(stats);

    // Keep history within limits
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Check for threshold violations
    this.checkThresholds(stats);

    // Check for memory leaks
    this.detectMemoryLeaks();

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.warn('Memory monitor callback error:', error);
      }
    });
  }

  private checkThresholds(stats: MemoryStats) {
    if (stats.heapUsed > this.thresholds.heapUsed) {
      console.warn(
        `⚠️ High heap usage: ${stats.heapUsed}MB (threshold: ${this.thresholds.heapUsed}MB)`
      );
      this.suggestOptimizations();
    }

    if (stats.rss > this.thresholds.rss) {
      console.warn(
        `⚠️ High RSS usage: ${stats.rss}MB (threshold: ${this.thresholds.rss}MB)`
      );
      this.suggestOptimizations();
    }
  }

  private detectMemoryLeaks() {
    if (this.memoryHistory.length < 10) return;

    const windowSize = Math.min(10, this.memoryHistory.length);
    const recentStats = this.memoryHistory.slice(-windowSize);

    const firstStat = recentStats[0];
    const lastStat = recentStats[recentStats.length - 1];

    const heapGrowth = lastStat.heapUsed - firstStat.heapUsed;
    const timeSpan = lastStat.timestamp - firstStat.timestamp;

    // If heap grew by more than 20MB in the last window
    if (heapGrowth > 20 && timeSpan > 60000) {
      // 1 minute
      console.warn(
        `🚨 Potential memory leak detected: ${heapGrowth}MB growth in ${Math.round(timeSpan / 1000)}s`
      );
      this.suggestLeakFixes();
    }
  }

  private suggestOptimizations() {
    console.log(`🔧 Memory optimization suggestions:
    - Clear unused caches and references
    - Use WeakMap/WeakSet for temporary references
    - Implement object pooling for frequently created objects
    - Check for unclosed database connections
    - Review component state management`);
  }

  private suggestLeakFixes() {
    console.log(`🔧 Memory leak prevention tips:
    - Clean up event listeners in useEffect cleanup
    - Cancel pending API requests on component unmount
    - Clear intervals and timeouts
    - Close database connections
    - Use weak references for caches`);
  }

  onMemoryUpdate(callback: (stats: MemoryStats) => void) {
    this.callbacks.push(callback);

    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getMemoryStats(): MemoryStats | null {
    return this.memoryHistory.length > 0
      ? this.memoryHistory[this.memoryHistory.length - 1]
      : null;
  }

  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  forceGarbageCollection() {
    if (typeof global !== 'undefined' && global.gc) {
      console.log('🗑️ Forcing garbage collection...');
      global.gc();

      // Collect stats after GC
      setTimeout(() => this.collectMemoryStats(), 100);
    } else {
      console.warn(
        'Garbage collection not available. Run with --expose-gc flag.'
      );
    }
  }

  cleanup() {
    this.stopMonitoring();
    this.memoryHistory = [];
    this.callbacks = [];
  }

  // Client-side memory monitoring (simplified)
  static startClientMonitoring() {
    if (typeof window === 'undefined') return;

    const monitor = {
      start() {
        setInterval(() => {
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            const stats = {
              used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
            };

            console.log(
              `📊 Client Memory: ${stats.used}MB / ${stats.total}MB (limit: ${stats.limit}MB)`
            );

            if (stats.used > 50) {
              // 50MB threshold
              console.warn('⚠️ High client-side memory usage detected');
            }
          }
        }, 60000); // Check every minute
      },
    };

    monitor.start();
    return monitor;
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  memoryMonitor.startMonitoring();
}

// Export types and utilities
export type { MemoryStats, MemoryThresholds };

// Memory cleanup utilities
export const memoryUtils = {
  // Clear large objects and arrays
  clearLargeObjects(...objects: any[]) {
    objects.forEach(obj => {
      if (Array.isArray(obj)) {
        obj.length = 0;
      } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => delete obj[key]);
      }
    });
  },

  // Create a memory-efficient cache with automatic cleanup
  createCache<T>(maxSize: number = 100, ttl: number = 300000) {
    // 5 minutes default TTL
    const cache = new Map<string, { value: T; expires: number }>();

    const cleanup = () => {
      const now = Date.now();
      for (const [key, item] of cache.entries()) {
        if (now > item.expires) {
          cache.delete(key);
        }
      }
    };

    const cleanupInterval = setInterval(cleanup, ttl / 2);

    return {
      get(key: string): T | null {
        const item = cache.get(key);
        if (!item || Date.now() > item.expires) {
          cache.delete(key);
          return null;
        }
        return item.value;
      },

      set(key: string, value: T) {
        if (cache.size >= maxSize) {
          // Remove oldest entry
          const firstKey = cache.keys().next().value;
          if (firstKey) {
            cache.delete(firstKey);
          }
        }
        cache.set(key, {
          value,
          expires: Date.now() + ttl,
        });
      },

      clear() {
        cache.clear();
      },

      destroy() {
        clearInterval(cleanupInterval);
        cache.clear();
      },

      size: () => cache.size,
    };
  },

  // Debounced function that cleans up after itself
  createDebouncedFunction<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    }) as T & { cancel: () => void };

    debouncedFn.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return debouncedFn;
  },
};
