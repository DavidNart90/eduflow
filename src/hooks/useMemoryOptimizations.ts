// Optimized hooks to prevent memory leaks and reduce re-renders
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to prevent memory leaks from timers
 */
export function useTimer() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = globalThis.setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeoutId);
    }, delay);

    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = globalThis.setInterval(callback, delay);
    intervalsRef.current.add(intervalId);
    return intervalId;
  }, []);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    globalThis.clearTimeout(timeoutId);
    timeoutsRef.current.delete(timeoutId);
  }, []);

  const clearInterval = useCallback((intervalId: NodeJS.Timeout) => {
    globalThis.clearInterval(intervalId);
    intervalsRef.current.delete(intervalId);
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(id => globalThis.clearTimeout(id));
    intervalsRef.current.forEach(id => globalThis.clearInterval(id));
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    clearAll,
  };
}

/**
 * Hook to debounce function calls and prevent excessive API calls
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook to throttle function calls
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        return callbackRef.current(...args);
      }
      return undefined;
    }) as T,
    [delay]
  );

  return throttledCallback;
}

/**
 * Hook to manage event listeners and prevent memory leaks
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Element | Document | Window,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef<(event: WindowEventMap[K]) => void>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element ?? window;
    if (!targetElement?.addEventListener) return undefined;

    const eventListener = (event: Event) => {
      savedHandler.current?.(event as WindowEventMap[K]);
    };

    targetElement.addEventListener(eventType, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventType, eventListener, options);
    };
  }, [eventType, element, options]);
}

/**
 * Hook to prevent excessive re-renders with stable references
 */
export function useStableRef<T>(value: T) {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
