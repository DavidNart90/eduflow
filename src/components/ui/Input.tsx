import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
  floating?: boolean;
  rightIconInteractive?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      sizeVariant = 'md',
      floating = false,
      disabled,
      rightIconInteractive = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'w-full rounded-xl border transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-gray-400',
      'font-medium'
    );

    const variants = {
      default: cn(
        'border-secondary-200/60 dark:border-gray-600 bg-white dark:bg-gray-700',
        'focus:border-primary-500/60 focus:ring-primary-500/20',
        'hover:border-secondary-300/80 dark:hover:border-gray-500'
      ),
      filled: cn(
        'border-secondary-200/60 dark:border-gray-600 bg-secondary-50/50 dark:bg-gray-600/50',
        'focus:border-primary-500/60 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-700',
        'hover:border-secondary-300/80 dark:hover:border-gray-500 hover:bg-secondary-50/80 dark:hover:bg-gray-600/80'
      ),
      outlined: cn(
        'border-secondary-200/60 dark:border-gray-600 bg-transparent',
        'focus:border-primary-500/60 focus:ring-primary-500/20',
        'hover:border-secondary-300/80 dark:hover:border-gray-500'
      ),
      minimal: cn(
        'border-0 bg-transparent',
        'focus:ring-0 focus:border-b-2 focus:border-primary-500',
        'hover:border-b-2 hover:border-secondary-300/60 dark:hover:border-gray-400'
      ),
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-3.5 text-base',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
    };

    const inputClasses = cn(
      baseClasses,
      variants[variant],
      sizes[sizeVariant],
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      error &&
        cn(
          'border-error-300 focus:border-error-500/60 focus:ring-error-500/20',
          variant === 'minimal' && 'focus:border-error-500'
        ),
      className
    );

    return (
      <div className='w-full group'>
        {label && !floating && (
          <label className='block text-sm font-semibold text-secondary-800 dark:text-gray-200 mb-2'>
            {label}
          </label>
        )}
        <div className='relative'>
          {leftIcon && (
            <div
              className={cn(
                'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none',
                'text-secondary-500 dark:text-gray-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors duration-200'
              )}
            >
              <div className={iconSizes[sizeVariant]}>{leftIcon}</div>
            </div>
          )}
          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            placeholder={floating && label ? label : props.placeholder}
            suppressHydrationWarning
            {...props}
          />
          {rightIcon && (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center',
                !rightIconInteractive && 'pointer-events-none',
                'text-secondary-500 dark:text-gray-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors duration-200'
              )}
            >
              <div className={iconSizes[sizeVariant]}>{rightIcon}</div>
            </div>
          )}
          {floating && label && (
            <label
              className={cn(
                'absolute left-4 top-3 text-sm transition-all duration-200 pointer-events-none',
                'text-secondary-600 dark:text-gray-300 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400',
                'group-focus-within:-translate-y-6 group-focus-within:text-xs',
                'group-focus-within:font-semibold',
                props.value &&
                  'text-xs -translate-y-6 font-semibold text-primary-600 dark:text-primary-400'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {(error || helperText) && (
          <div className='mt-2 space-y-1'>
            {error && (
              <p className='text-sm text-error-600 dark:text-error-400 flex items-center space-x-1 font-medium'>
                <span className='text-xs'>⚠</span>
                <span>{error}</span>
              </p>
            )}
            {helperText && !error && (
              <p className='text-sm text-secondary-600 dark:text-gray-300 font-medium'>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
