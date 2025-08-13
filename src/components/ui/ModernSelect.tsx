'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ModernSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  sizeVariant?: 'sm' | 'md' | 'lg';
  onChange?: (value: string) => void;
  floating?: boolean;
  disabled?: boolean;
  className?: string;
}

const ModernSelect = React.forwardRef<HTMLDivElement, ModernSelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      value,
      variant = 'default',
      sizeVariant = 'md',
      onChange,
      floating = false,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(
      option => option.value === selectedValue
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      setIsOpen(false);
      onChange?.(optionValue);
    };

    const baseClasses = cn(
      'w-full rounded-xl border transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'text-secondary-900 cursor-pointer'
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
      isOpen && 'ring-2 ring-primary-500/20 border-primary-500/60',
      className
    );

    return (
      <div className='w-full group' ref={ref}>
        {label && !floating && (
          <label className='block text-sm font-medium text-secondary-700 mb-2'>
            {label}
          </label>
        )}
        <div className='relative' ref={dropdownRef}>
          {/* Select Trigger */}
          <div
            className={selectClasses}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <div className='flex items-center justify-between'>
              <span
                className={cn(
                  'truncate',
                  !selectedValue && 'text-secondary-400'
                )}
              >
                {selectedOption
                  ? selectedOption.label
                  : placeholder || 'Select an option'}
              </span>

              {/* Custom dropdown arrow */}
              <svg
                className={cn(
                  'h-5 w-5 text-secondary-400 transition-all duration-200',
                  isOpen && 'rotate-180 text-primary-500'
                )}
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
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              className={cn(
                'absolute z-50 w-full mt-1 bg-white rounded-xl border border-secondary-200/60',
                'shadow-lg shadow-secondary-900/10',
                'max-h-60 overflow-auto'
              )}
            >
              {options.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    'px-4 py-3 cursor-pointer transition-colors duration-150',
                    'hover:bg-primary-50 hover:text-primary-900',
                    'first:rounded-t-xl last:rounded-b-xl',
                    selectedValue === option.value &&
                      'bg-primary-50 text-primary-900 font-medium',
                    option.disabled &&
                      'text-secondary-400 bg-secondary-50 cursor-not-allowed hover:bg-secondary-50 hover:text-secondary-400'
                  )}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  <span className='block truncate'>{option.label}</span>
                </div>
              ))}
            </div>
          )}

          {floating && label && (
            <label
              className={cn(
                'absolute left-4 top-3 text-sm transition-all duration-200 pointer-events-none',
                'text-secondary-500 group-focus-within:text-primary-500',
                'group-focus-within:-translate-y-6 group-focus-within:text-xs',
                'group-focus-within:font-medium',
                selectedValue &&
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

ModernSelect.displayName = 'ModernSelect';

export default ModernSelect;
