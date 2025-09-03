'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  closable?: boolean;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      type,
      title,
      message,
      duration = 5000,
      onClose,
      closable = true,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleClose = useCallback(() => {
      setIsRemoving(true);
      setTimeout(() => {
        onClose(id);
      }, 300); // Match exit animation duration
    }, [id, onClose]);

    // Auto-dismiss functionality
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, [duration, handleClose]);

    // Show animation on mount
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }, []);

    // Toast variant configurations
    const variants = {
      success: {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-800 dark:text-green-200',
        messageColor: 'text-green-700 dark:text-green-300',
        progressColor: 'bg-green-500',
      },
      error: {
        icon: XCircleIcon,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-800 dark:text-red-200',
        messageColor: 'text-red-700 dark:text-red-300',
        progressColor: 'bg-red-500',
      },
      warning: {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        titleColor: 'text-yellow-800 dark:text-yellow-200',
        messageColor: 'text-yellow-700 dark:text-yellow-300',
        progressColor: 'bg-yellow-500',
      },
      info: {
        icon: InformationCircleIcon,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-800 dark:text-blue-200',
        messageColor: 'text-blue-700 dark:text-blue-300',
        progressColor: 'bg-blue-500',
      },
    };

    const config = variants[type];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full max-w-sm pointer-events-auto overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ease-out',
          config.bgColor,
          config.borderColor,
          isVisible && !isRemoving
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-95',
          isRemoving && 'translate-x-full opacity-0 scale-95'
        )}
        {...props}
      >
        {/* Progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className='absolute top-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10'>
            <div
              className={cn(
                'h-full transition-all ease-linear',
                config.progressColor
              )}
              style={{
                animation: `shrink-progress ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}

        <div className='p-4'>
          <div className='flex items-start space-x-3'>
            {/* Icon */}
            <div className='flex-shrink-0'>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <p className={cn('text-sm font-medium', config.titleColor)}>
                {title}
              </p>
              {message && (
                <p className={cn('mt-1 text-sm', config.messageColor)}>
                  {message}
                </p>
              )}
            </div>

            {/* Close button */}
            {closable && (
              <div className='flex-shrink-0'>
                <button
                  type='button'
                  className={cn(
                    'inline-flex rounded-md p-1.5 transition-colors duration-200 hover:bg-black/10 dark:hover:bg-white/10',
                    config.iconColor
                  )}
                  onClick={handleClose}
                >
                  <span className='sr-only'>Dismiss</span>
                  <XMarkIcon className='h-4 w-4' />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export default Toast;

// Add keyframes for progress bar animation to global CSS
const progressKeyframes = `
@keyframes shrink-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;

// Export for adding to global styles
export { progressKeyframes };
