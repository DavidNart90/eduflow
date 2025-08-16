import { useEffect, useRef, useCallback } from 'react';
import { validateAndRefreshTokens } from '@/lib/token-validator';

interface ApiCallOptions {
  enabled?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  retryOnTokenRefresh?: boolean;
  maxRetries?: number;
}
/**
 * Enhanced API call hook with token validation and retry logic
 * Used across teacher pages to prevent unnecessary re-fetches and handle auth errors
 */
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  options: ApiCallOptions = {}
) {
  const {
    enabled = true,
    onSuccess,
    onError,
    retryOnTokenRefresh = true,
    maxRetries = 2,
  } = options;

  const hasFetchedRef = useRef(false);
  const lastDepsRef = useRef<unknown[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const memoizedApiCall = useCallback(apiCall, [apiCall]);
  const memoizedOnSuccess = useCallback(
    (data: unknown) => {
      if (onSuccess) {
        onSuccess(data);
      }
    },
    [onSuccess]
  );
  const memoizedOnError = useCallback(
    (error: Error) => {
      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  const executeApiCall = useCallback(async () => {
    try {
      const result = await memoizedApiCall();
      memoizedOnSuccess(result);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      // Check if it's an auth error and we can retry with token refresh
      const isAuthError =
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid token'));

      if (
        isAuthError &&
        retryOnTokenRefresh &&
        retryCountRef.current < maxRetries
      ) {
        try {
          // Attempt to refresh tokens
          const validationResult = await validateAndRefreshTokens();

          if (validationResult.isValid) {
            retryCountRef.current++;
            // Retry the API call with refreshed token
            setTimeout(() => executeApiCall(), 100);
            return;
          }
        } catch {
          // Token refresh failed - will use regular error handling
          if (process.env.NODE_ENV === 'development') {
            // Only log in development
          }
        }
      }

      memoizedOnError(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }, [
    memoizedApiCall,
    memoizedOnSuccess,
    memoizedOnError,
    retryOnTokenRefresh,
    maxRetries,
  ]);

  useEffect(() => {
    // Check if dependencies have changed
    const depsChanged = dependencies.some(
      (dep, index) => dep !== lastDepsRef.current[index]
    );

    if (!enabled || (!depsChanged && hasFetchedRef.current)) {
      return undefined;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    hasFetchedRef.current = true;
    lastDepsRef.current = [...dependencies];

    executeApiCall();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // Note: Using spread operator for dependencies is necessary here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, executeApiCall, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      hasFetchedRef.current = false;
      lastDepsRef.current = [];
      retryCountRef.current = 0;
    };
  }, []);

  const refetch = useCallback(() => {
    hasFetchedRef.current = false;
    lastDepsRef.current = [];
    retryCountRef.current = 0;
  }, []);

  return { refetch };
}

/**
 * Hook to optimize useEffect cleanup and prevent memory leaks
 * Now includes proper dependency handling
 */
export function useCleanupEffect(
  effect: () => void | (() => void),
  dependencies: unknown[]
) {
  const mountedRef = useRef(true);
  const effectRef = useRef(effect);

  // Update effect ref when effect changes
  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  const memoizedEffect = useCallback(() => {
    return effectRef.current();
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      const cleanup = memoizedEffect();
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
    return undefined;
    // Note: Using spread operator for dependencies is necessary here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedEffect, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
}

/**
 * Hook to prevent excessive re-renders during navigation
 * Creates a stable callback reference that doesn't change between renders
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stableCallback = useRef<T>(((...args: unknown[]) => {
    return callbackRef.current(...args);
  }) as T).current;

  return stableCallback;
}

/**
 * Hook for session health monitoring
 * Validates tokens periodically and handles refresh automatically
 */
export function useSessionHealthMonitor(
  validateSession: () => Promise<boolean>,
  interval = 5 * 60 * 1000 // 5 minutes
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (isActiveRef.current) {
        try {
          await validateSession();
        } catch {
          // Session health check failed - will be retried next interval
          if (process.env.NODE_ENV === 'development') {
            // Only log in development
          }
        }
      }
    }, interval);
  }, [validateSession, interval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startMonitoring();
    return () => {
      stopMonitoring();
      isActiveRef.current = false;
    };
  }, [startMonitoring, stopMonitoring]);

  return { startMonitoring, stopMonitoring };
}
