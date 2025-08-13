import React from 'react';
import { cn } from '@/lib/utils';

interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      sizeVariant = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'rounded-full border transition-all duration-200',
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

    const radioClasses = cn(
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

    return (
      <div className='w-full'>
        <div className='flex items-start space-x-3'>
          <div className='relative flex-shrink-0'>
            <input
              ref={ref}
              type='radio'
              className={radioClasses}
              disabled={disabled}
              {...props}
            />
            {/* Custom radio design */}
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center pointer-events-none',
                'transition-all duration-200'
              )}
            >
              <div
                className={cn(
                  'rounded-full bg-white transition-all duration-200',
                  'scale-0 opacity-0',
                  'peer-checked:scale-100 peer-checked:opacity-100',
                  sizeVariant === 'sm' && 'w-1.5 h-1.5',
                  sizeVariant === 'md' && 'w-2 h-2',
                  sizeVariant === 'lg' && 'w-2.5 h-2.5'
                )}
              />
            </div>
          </div>

          {label && (
            <div className='flex-1 min-w-0'>
              <label
                className={cn(
                  'block font-medium text-secondary-900 cursor-pointer',
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

Radio.displayName = 'Radio';

export default Radio;
