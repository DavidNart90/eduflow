'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      // Error logged for development debugging
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could also log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700'>
            <div className='text-center'>
              {/* Error Icon */}
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4'>
                <svg
                  className='h-6 w-6 text-red-600 dark:text-red-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Something went wrong
              </h3>

              {/* Error Message */}
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
                We encountered an unexpected error. Please try refreshing the
                page or contact support if the problem persists.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mb-6 text-left'>
                  <summary className='text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2'>
                    Error Details
                  </summary>
                  <div className='bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto'>
                    <div className='mb-2'>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className='mt-1 whitespace-pre-wrap'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className='flex flex-col sm:flex-row gap-3'>
                <Button
                  variant='primary'
                  onClick={this.handleReset}
                  className='flex-1'
                >
                  Try Again
                </Button>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                  className='flex-1'
                >
                  Refresh Page
                </Button>
              </div>

              {/* Contact Support */}
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-4'>
                Need help? Contact{' '}
                <a
                  href='mailto:support@eduflow.com'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  support@eduflow.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      // Error logged for development debugging
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// Error Fallback Component for specific error types
export const ErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
  variant?: 'default' | 'minimal' | 'full';
}> = ({ error, resetErrorBoundary, variant = 'default' }) => {
  if (variant === 'minimal') {
    return (
      <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
        <div className='flex items-center space-x-2'>
          <svg
            className='h-4 w-4 text-red-600 dark:text-red-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
          <span className='text-sm text-red-700 dark:text-red-300'>
            {error.message}
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={resetErrorBoundary}
            className='text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700'>
          <div className='text-center'>
            <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-6'>
              <svg
                className='h-8 w-8 text-red-600 dark:text-red-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
              Application Error
            </h2>

            <p className='text-gray-600 dark:text-gray-400 mb-6'>
              We{'\u2019'}re sorry, but something went wrong. Our team has been
              notified and is working to fix the issue.
            </p>

            <div className='bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left'>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                Error Details:
              </h3>
              <p className='text-sm text-gray-700 dark:text-gray-300 font-mono'>
                {error.message}
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button variant='primary' onClick={resetErrorBoundary}>
                Try Again
              </Button>
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </Button>
              <Button variant='ghost' onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className='p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'>
      <div className='text-center'>
        <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4'>
          <svg
            className='h-6 w-6 text-red-600 dark:text-red-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>

        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
          Something went wrong
        </h3>

        <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
          {error.message}
        </p>

        <Button variant='primary' onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </div>
    </div>
  );
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ErrorBoundary;
