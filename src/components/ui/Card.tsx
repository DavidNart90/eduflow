import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'summary'
    | 'interactive'
    | 'elevated'
    | 'minimal'
    | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  border?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      border = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'rounded-modern transition-colors duration-150 ease-out',
      border && 'border border-border/40'
    );

    const variants = {
      default: 'bg-card text-card-foreground shadow-modern',
      summary:
        'bg-card text-card-foreground shadow-modern hover:shadow-modern-lg transition-all duration-300 ease-out',
      interactive:
        'bg-card text-card-foreground shadow-modern hover:shadow-modern-xl hover-lift transition-all duration-300 ease-out cursor-pointer',
      elevated: 'bg-card text-card-foreground shadow-sm ',
      minimal: 'bg-transparent border-0 shadow-none',
      glass: 'card-enhanced backdrop-blur-sm',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          hover &&
            variant !== 'interactive' &&
            'hover:shadow-modern-lg transition-shadow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      icon,
      align = 'left',
      action,
      children,
      ...props
    },
    ref
  ) => {
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <div
        ref={ref}
        className={cn('mb-6', alignClasses[align], className)}
        {...props}
      >
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-4'>
            {icon && (
              <div className='flex-shrink-0'>
                <div className='flex h-10 w-10 items-center justify-center rounded-modern bg-accent text-accent-foreground'>
                  {icon}
                </div>
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 className='text-xl font-semibold text-card-foreground leading-tight text-balance'>
                {title}
              </h3>
              {subtitle && (
                <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className='flex-shrink-0'>{action}</div>}
        </div>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, spacing = 'md', ...props }, ref) => {
    const spacingClasses = {
      none: '',
      sm: 'space-y-3',
      md: 'space-y-4',
      lg: 'space-y-6',
    };

    return (
      <div
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  border?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, border = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between pt-6 mt-6',
          border && 'border-t border-border/40',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
