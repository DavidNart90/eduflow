import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
  onChange?: (value: string) => void;
  floating?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      variant = 'default',
      sizeVariant = 'md',
      floating = false,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'w-full rounded-xl border transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
      'text-secondary-900 placeholder:text-secondary-400'
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
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-3.5 text-base',
    };

    const selectClasses = cn(
      baseClasses,
      variants[variant],
      sizes[sizeVariant],
      error &&
        cn(
          'border-error-300 focus:border-error-500/60 focus:ring-error-500/20',
          variant === 'minimal' && 'focus:border-error-500'
        ),
      className
    );

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className='w-full group'>
        {label && !floating && (
          <label className='block text-sm font-medium text-secondary-700 mb-2'>
            {label}
          </label>
        )}
        <div className='relative'>
          <select
            ref={ref}
            className={selectClasses}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          >
            {placeholder && (
              <option value='' disabled className='text-secondary-400 bg-white'>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'py-2 px-3 text-secondary-900 bg-white',
                  'hover:bg-primary-50 hover:text-primary-900',
                  'focus:bg-primary-50 focus:text-primary-900',
                  option.disabled && 'text-secondary-400 bg-secondary-50'
                )}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <svg
              className='h-5 w-5 text-secondary-400 group-focus-within:text-primary-500 transition-colors duration-200'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>

          {floating && label && (
            <label
              className={cn(
                'absolute left-4 top-3 text-sm transition-all duration-200 pointer-events-none',
                'text-secondary-500 group-focus-within:text-primary-500',
                'group-focus-within:-translate-y-6 group-focus-within:text-xs',
                'group-focus-within:font-medium',
                props.value &&
                  'text-xs -translate-y-6 font-medium text-primary-500'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {(error || helperText) && (
          <div className='mt-2 space-y-1'>
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
    );
  }
);

Select.displayName = 'Select';

export default Select;
