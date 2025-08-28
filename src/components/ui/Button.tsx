import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'group relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';

    const variants = {
      primary:
        'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      secondary:
        'bg-gradient-to-r from-secondary-100 to-secondary-200 hover:from-secondary-200 hover:to-secondary-300 text-secondary-900 border border-secondary-200 hover:scale-105',
      success:
        'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      error:
        'bg-gradient-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      ghost:
        'bg-transparent hover:bg-secondary-100 text-secondary-700 hover:text-secondary-900 hover:scale-105',
      outline:
        'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white hover:scale-105 transition-colors duration-300',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-xl',
      md: 'px-6 py-3 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {/* Background Pattern for Primary/Success/Error */}
        {(variant === 'primary' ||
          variant === 'success' ||
          variant === 'error') && (
          <div className='absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <svg
            className='animate-spin -ml-1 mr-2 h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        )}

        {/* Icon and Content */}
        <div className='relative flex items-center'>
          {!loading && icon && iconPosition === 'left' && (
            <span className='mr-2 transition-transform duration-200 group-hover:scale-110'>
              {icon}
            </span>
          )}
          <span className='transition-transform duration-200 group-hover:scale-105'>
            {children}
          </span>
          {!loading && icon && iconPosition === 'right' && (
            <span className='ml-2 transition-transform duration-200 group-hover:scale-110'>
              {icon}
            </span>
          )}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
