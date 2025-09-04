// Performance monitoring and memory leak detection
import { useEffect, useRef } from 'react';

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private memoryInterval: NodeJS.Timeout | null = null;
  private lastMemoryUsage = 0;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    console.log(
      '🔍 Performance monitoring started (optimized for lower CPU usage)'
    );

    // Only monitor in development and when page is visible
    if (process.env.NODE_ENV !== 'development') return;

    // Monitor long tasks (but less frequently)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          // Only process if page is visible
          if (document.hidden) return;

          for (const entry of list.getEntries()) {
            if (entry.duration > 100) {
              // Increased threshold to 100ms
              // Tasks longer than 100ms
              console.warn(
                `⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`
              );
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch {
        console.log('Long task observer not supported');
      }

      // Monitor layout shifts
      try {
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & {
              value: number;
            };
            if (layoutShiftEntry.value > 0.1) {
              console.warn(
                `⚠️ Layout shift detected: ${layoutShiftEntry.value.toFixed(3)}`
              );
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch {
        console.log('Layout shift observer not supported');
      }

      // Monitor largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.startTime > 2500) {
              // LCP > 2.5s is poor
              console.warn(`⚠️ Poor LCP: ${entry.startTime.toFixed(2)}ms`);
            }
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch {
        console.log('LCP observer not supported');
      }
    }

    // Monitor memory usage less frequently (every 60 seconds)
    this.memoryInterval = setInterval(() => {
      // Skip if page is hidden to save CPU
      if (document.hidden) return;

      const currentMemory = PerformanceMonitor.getMemoryStats();
      if (currentMemory && currentMemory.used > this.lastMemoryUsage * 1.5) {
        // Only log significant memory increases
        console.warn('📈 Memory usage increased significantly:', {
          from: `${this.lastMemoryUsage}MB`,
          to: `${currentMemory.used}MB`,
          percentage: `${currentMemory.percentage}%`,
        });
      }
      this.lastMemoryUsage = currentMemory?.used || 0;
    }, 60000); // 60 seconds instead of 5 seconds
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('🛑 Performance monitoring stopped');

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear memory monitoring
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  pause() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    this.observers.forEach(observer => observer.disconnect());
  }

  resume() {
    if (this.isMonitoring && !this.memoryInterval) {
      // Restart memory monitoring
      this.memoryInterval = setInterval(() => {
        if (document.hidden) return;

        const currentMemory = PerformanceMonitor.getMemoryStats();
        if (currentMemory && currentMemory.used > this.lastMemoryUsage * 1.5) {
          console.warn('📈 Memory usage increased significantly:', {
            from: `${this.lastMemoryUsage}MB`,
            to: `${currentMemory.used}MB`,
            percentage: `${currentMemory.percentage}%`,
          });
        }
        this.lastMemoryUsage = currentMemory?.used || 0;
      }, 60000);
    }
  }

  // Force garbage collection (if available)
  static forceGC() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as Window & { gc: () => void }).gc();
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Forced garbage collection');
      }
    }
  }

  // Get current memory stats
  static getMemoryStats() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (
      performance as Performance & {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      percentage: Math.round(
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      ),
    };
  }

  // Monitor React component re-renders
  static logRerender(componentName: string, props?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} re-rendered`, props ? { props } : '');
    }
  }

  // Monitor API call frequency
  private apiCallCounts: Map<string, number> = new Map();

  logApiCall(endpoint: string) {
    const count = this.apiCallCounts.get(endpoint) || 0;
    this.apiCallCounts.set(endpoint, count + 1);

    if (count > 10) {
      // More than 10 calls to same endpoint
      console.warn(`🌐 Excessive API calls to ${endpoint}: ${count + 1} calls`);
    }
  }

  // Reset API call counters
  resetApiCallCounts() {
    this.apiCallCounts.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper hook for React components
export const usePerformanceMonitoring = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    if (renderCount.current > 5) {
      PerformanceMonitor.logRerender(componentName, {
        renderCount: renderCount.current,
      });
    }
  });
};

// Start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();

  // Add to global window for CPU optimizer access
  window.performanceMonitor = {
    pause: () => performanceMonitor.pause(),
    resume: () => performanceMonitor.resume(),
  };
}
