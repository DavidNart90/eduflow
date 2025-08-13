import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'outline'
    | 'ghost'
    | 'solid';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: boolean;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      rounded = true,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      rounded ? 'rounded-full' : 'rounded-lg'
    );

    const variants = {
      primary: cn(
        'bg-primary-50 text-primary-700 border border-primary-200/60',
        'hover:bg-primary-100 hover:border-primary-300/60'
      ),
      secondary: cn(
        'bg-secondary-50 text-secondary-700 border border-secondary-200/60',
        'hover:bg-secondary-100 hover:border-secondary-300/60'
      ),
      success: cn(
        'bg-success-50 text-success-700 border border-success-200/60',
        'hover:bg-success-100 hover:border-success-300/60'
      ),
      warning: cn(
        'bg-warning-50 text-warning-700 border border-warning-200/60',
        'hover:bg-warning-100 hover:border-warning-300/60'
      ),
      error: cn(
        'bg-error-50 text-error-700 border border-error-200/60',
        'hover:bg-error-100 hover:border-error-300/60'
      ),
      info: cn(
        'bg-blue-50 text-blue-700 border border-blue-200/60',
        'hover:bg-blue-100 hover:border-blue-300/60'
      ),
      outline: cn(
        'bg-transparent text-secondary-700 border border-secondary-300/60',
        'hover:bg-secondary-50 hover:border-secondary-400/60'
      ),
      ghost: cn(
        'bg-transparent text-secondary-600 border border-transparent',
        'hover:bg-secondary-50 hover:text-secondary-700'
      ),
      solid: cn(
        'bg-primary-600 text-white border border-primary-600',
        'hover:bg-primary-700 hover:border-primary-700'
      ),
    };

    const sizes = {
      sm: cn('px-2 py-0.5 text-xs', 'gap-1'),
      md: cn('px-3 py-1 text-sm', 'gap-1.5'),
      lg: cn('px-4 py-1.5 text-sm', 'gap-2'),
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-4 h-4',
    };

    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    const dotColors = {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-blue-500',
      outline: 'bg-secondary-500',
      ghost: 'bg-secondary-500',
      solid: 'bg-white',
    };

    return (
      <span
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full flex-shrink-0',
              dotSizes[size],
              dotColors[variant]
            )}
          />
        )}

        {icon && iconPosition === 'left' && (
          <span className={cn('flex-shrink-0', iconSizes[size])}>{icon}</span>
        )}

        <span className='truncate'>{children}</span>

        {icon && iconPosition === 'right' && (
          <span className={cn('flex-shrink-0', iconSizes[size])}>{icon}</span>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
