'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      sizeVariant = 'md',
      indeterminate = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'rounded border transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'appearance-none relative'
    );

    const variants = {
      default: cn(
        'border-secondary-300 bg-white',
        'focus:border-primary-500 focus:ring-primary-500/20',
        'hover:border-primary-400',
        'checked:bg-primary-500 checked:border-primary-500'
      ),
      filled: cn(
        'border-secondary-300 bg-secondary-50',
        'focus:border-primary-500 focus:ring-primary-500/20 focus:bg-white',
        'hover:border-primary-400 hover:bg-secondary-100',
        'checked:bg-primary-500 checked:border-primary-500'
      ),
      minimal: cn(
        'border-secondary-200 bg-transparent',
        'focus:border-primary-500 focus:ring-primary-500/20',
        'hover:border-primary-400',
        'checked:bg-primary-500 checked:border-primary-500'
      ),
    };

    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const labelSizes = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    };

    const checkboxClasses = cn(
      baseClasses,
      variants[variant],
      sizes[sizeVariant],
      error &&
        cn(
          'border-error-300 focus:border-error-500 focus:ring-error-500/20',
          'checked:bg-error-500 checked:border-error-500'
        ),
      className
    );

    // Handle indeterminate state
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    return (
      <div className='w-full'>
        <div className='flex items-start space-x-3'>
          <div className='relative flex-shrink-0'>
            <input
              ref={ref}
              type='checkbox'
              className={checkboxClasses}
              disabled={disabled}
              {...props}
            />
            {/* Custom checkbox design */}
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center pointer-events-none',
                'transition-all duration-200'
              )}
            >
              <svg
                className={cn(
                  'transition-all duration-200',
                  sizes[sizeVariant],
                  'text-white opacity-0',
                  'peer-checked:opacity-100'
                )}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          </div>

          {label && (
            <div className='flex-1 min-w-0'>
              <label
                className={cn(
                  'block font-medium  text-slate-700 dark:text-slate-300 cursor-pointer',
                  labelSizes[sizeVariant],
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
              {(error || helperText) && (
                <div className='mt-1 space-y-1'>
                  {error && (
                    <p className='text-sm text-error-600 flex items-center space-x-1'>
                      <span className='text-xs'>⚠</span>
                      <span>{error}</span>
                    </p>
                  )}
                  {helperText && !error && (
                    <p className='text-sm text-secondary-500'>{helperText}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
