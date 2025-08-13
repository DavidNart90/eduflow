import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
  floating?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      sizeVariant = 'md',
      floating = false,
      resize = 'vertical',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'w-full rounded-xl border transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-secondary-400',
      'text-secondary-900 font-medium'
    );

    const variants = {
      default: cn(
        'border-secondary-200/60 bg-white',
        'focus:border-primary-500/60 focus:ring-primary-500/20',
        'hover:border-secondary-300/80'
      ),
      filled: cn(
        'border-secondary-200/60 bg-secondary-50/50',
        'focus:border-primary-500/60 focus:ring-primary-500/20 focus:bg-white',
        'hover:border-secondary-300/80 hover:bg-secondary-50/80'
      ),
      outlined: cn(
        'border-secondary-200/60 bg-transparent',
        'focus:border-primary-500/60 focus:ring-primary-500/20',
        'hover:border-secondary-300/80'
      ),
      minimal: cn(
        'border-0 bg-transparent',
        'focus:ring-0 focus:border-b-2 focus:border-primary-500',
        'hover:border-b-2 hover:border-secondary-300/60'
      ),
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[80px]',
      md: 'px-4 py-3 text-sm min-h-[100px]',
      lg: 'px-4 py-3.5 text-base min-h-[120px]',
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const textareaClasses = cn(
      baseClasses,
      variants[variant],
      sizes[sizeVariant],
      resizeClasses[resize],
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
          <label className='block text-sm font-semibold text-secondary-800 mb-2'>
            {label}
          </label>
        )}
        <div className='relative'>
          <textarea
            ref={ref}
            className={textareaClasses}
            disabled={disabled}
            placeholder={floating && label ? label : props.placeholder}
            {...props}
          />
          {floating && label && (
            <label
              className={cn(
                'absolute left-4 top-3 text-sm transition-all duration-200 pointer-events-none',
                'text-secondary-600 group-focus-within:text-primary-600',
                'group-focus-within:-translate-y-6 group-focus-within:text-xs',
                'group-focus-within:font-semibold',
                props.value &&
                  'text-xs -translate-y-6 font-semibold text-primary-600'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {(error || helperText) && (
          <div className='mt-2 space-y-1'>
            {error && (
              <p className='text-sm text-error-600 flex items-center space-x-1 font-medium'>
                <span className='text-xs'>⚠</span>
                <span>{error}</span>
              </p>
            )}
            {helperText && !error && (
              <p className='text-sm text-secondary-600 font-medium'>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
