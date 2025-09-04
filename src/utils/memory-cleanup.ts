// Memory cleanup utilities and optimization scripts
export class MemoryCleanup {
  private static timers: Set<NodeJS.Timeout> = new Set();
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static listeners: Map<
    EventTarget,
    { event: string; handler: EventListener }[]
  > = new Map();

  // Track and cleanup timers
  static setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  static setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  static clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  static clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  // Track and cleanup event listeners
  static addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);

    if (!this.listeners.has(target)) {
      this.listeners.set(target, []);
    }
    this.listeners.get(target)!.push({ event, handler });
  }

  static removeEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    target.removeEventListener(event, handler);

    const targetListeners = this.listeners.get(target);
    if (targetListeners) {
      const index = targetListeners.findIndex(
        l => l.event === event && l.handler === handler
      );
      if (index !== -1) {
        targetListeners.splice(index, 1);
      }
    }
  }

  // Cleanup all tracked resources
  static cleanupAll(): void {
    console.log('🧹 Starting memory cleanup...');

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove all event listeners
    this.listeners.forEach((listeners, target) => {
      listeners.forEach(({ event, handler }) => {
        target.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();

    console.log('✅ Memory cleanup completed');
  }

  // Force garbage collection if available
  static forceGC(): void {
    if (typeof window !== 'undefined') {
      // Request idle callback for cleanup
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          // Trigger potential garbage collection
          if ('gc' in window) {
            (window as any).gc();
            console.log('🗑️ Forced garbage collection');
          }
        });
      }
    }
  }

  // Monitor and report memory usage
  static getMemoryReport(): string {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return 'Memory monitoring not available';
    }

    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

    return `Memory Usage: ${used}MB / ${total}MB (${Math.round((used / total) * 100)}%) | Limit: ${limit}MB`;
  }

  // Cleanup DOM elements that might hold references
  static cleanupDOMReferences(): void {
    if (typeof document === 'undefined') return;

    // Remove any orphaned event listeners on document
    const elementsWithListeners = document.querySelectorAll(
      '[data-has-listeners]'
    );
    elementsWithListeners.forEach(el => {
      el.removeAttribute('data-has-listeners');
    });

    // Clear any cached DOM references in common global objects
    if ('_reactInternalInstance' in document) {
      delete (document as any)._reactInternalInstance;
    }

    console.log('🧽 DOM cleanup completed');
  }

  // Optimize images and media
  static optimizeMediaElements(): void {
    if (typeof document === 'undefined') return;

    // Remove src from hidden images to free memory
    const hiddenImages = document.querySelectorAll(
      'img[style*="display: none"], img[hidden]'
    );
    hiddenImages.forEach(img => {
      const imgEl = img as HTMLImageElement;
      if (imgEl.src && !imgEl.dataset.originalSrc) {
        imgEl.dataset.originalSrc = imgEl.src;
        imgEl.src = '';
      }
    });

    // Pause videos that are not visible
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      const rect = video.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible && !video.paused) {
        video.pause();
      }
    });

    console.log('📸 Media optimization completed');
  }

  // Schedule periodic cleanup
  static startPeriodicCleanup(
    intervalMs: number = 5 * 60 * 1000
  ): NodeJS.Timeout {
    return this.setInterval(() => {
      console.log('🔄 Running periodic cleanup...');
      this.optimizeMediaElements();
      this.forceGC();
      console.log(this.getMemoryReport());
    }, intervalMs);
  }
}

// Export cleanup utilities
export const cleanupMemory = () => MemoryCleanup.cleanupAll();
export const forceGC = () => MemoryCleanup.forceGC();
export const getMemoryReport = () => MemoryCleanup.getMemoryReport();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    MemoryCleanup.cleanupAll();
  });

  // Cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      MemoryCleanup.optimizeMediaElements();
      MemoryCleanup.forceGC();
    }
  });
}
