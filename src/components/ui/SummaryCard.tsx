import React from 'react';
import { cn } from '@/lib/utils';

interface TrendData {
  date: string;
  value: number;
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  trendData?: TrendData[];
  showTrendLine?: boolean;
  trendLineColor?: 'auto' | 'primary' | 'success' | 'warning' | 'error';
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'minimal'
    | 'glass';
  className?: string;
}

const SummaryCard = React.forwardRef<HTMLDivElement, SummaryCardProps>(
  (
    {
      title,
      value,
      description,
      icon,
      trend,
      trendData,
      showTrendLine = false,
      trendLineColor = 'auto',
      variant = 'default',
      className,
    },
    ref
  ) => {
    const variants = {
      default: cn(
        'bg-card text-card-foreground border-border/40',
        'hover:border-border/60 backdrop-blur-sm'
      ),
      primary: cn(
        'bg-gradient-to-br from-primary/8 to-primary/4 border-primary/20',
        'hover:border-primary/30 backdrop-blur-sm'
      ),
      success: cn(
        'bg-gradient-to-br from-success/8 to-success/4 border-success/20',
        'hover:border-success/30 backdrop-blur-sm'
      ),
      warning: cn(
        'bg-gradient-to-br from-warning/8 to-warning/4 border-warning/20',
        'hover:border-warning/30 backdrop-blur-sm'
      ),
      error: cn(
        'bg-gradient-to-br from-error/8 to-error/4 border-error/20',
        'hover:border-error/30 backdrop-blur-sm'
      ),
      minimal: cn('bg-transparent border-0 shadow-none', 'hover:bg-accent/50'),
      glass: cn('card-enhanced backdrop-blur-md', 'hover:backdrop-blur-lg'),
    };

    const iconVariants = {
      default: 'text-muted-foreground bg-accent',
      primary: 'text-primary bg-primary/8',
      success: 'text-success bg-success/8',
      warning: 'text-warning bg-warning/8',
      error: 'text-error bg-error/8',
      minimal: 'text-muted-foreground bg-accent/60',
      glass: 'text-card-foreground bg-accent/80 backdrop-blur-sm',
    };

    const getTrendIcon = (isPositive: boolean) => {
      if (isPositive) {
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
            />
          </svg>
        );
      }
      return (
        <svg
          className='w-4 h-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
          />
        </svg>
      );
    };

    const getTrendColor = (isPositive: boolean) => {
      return isPositive
        ? 'bg-success/8 text-success border-success/20'
        : 'bg-error/8 text-error border-error/20';
    };

    const getTrendLineColor = () => {
      if (trendLineColor !== 'auto') {
        const colors = {
          primary: 'stroke-primary',
          success: 'stroke-success',
          warning: 'stroke-warning',
          error: 'stroke-error',
        };
        return colors[trendLineColor];
      }

      // Auto color based on trend direction
      if (trend?.isPositive) {
        return 'stroke-success';
      }
      if (trend?.isPositive === false) {
        return 'stroke-error';
      }

      // Default color based on variant
      const variantColors = {
        primary: 'stroke-primary',
        success: 'stroke-success',
        warning: 'stroke-warning',
        error: 'stroke-error',
        default: 'stroke-muted-foreground',
        minimal: 'stroke-muted-foreground',
        glass: 'stroke-card-foreground',
      };
      return variantColors[variant];
    };

    const generateTrendLine = (data: TrendData[]) => {
      if (!data || data.length < 2) return null;

      const width = 80;
      const height = 40;
      const padding = 4;

      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const range = maxValue - minValue || 1;

      const points = data.map((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y =
          height -
          padding -
          ((point.value - minValue) / range) * (height - 2 * padding);
        return `${x},${y}`;
      });

      return (
        <svg
          width={width}
          height={height}
          className='flex-shrink-0'
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient
              id={`gradient-${variant}`}
              x1='0%'
              y1='0%'
              x2='0%'
              y2='100%'
            >
              <stop offset='0%' stopColor='currentColor' stopOpacity='0.3' />
              <stop offset='100%' stopColor='currentColor' stopOpacity='0' />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`M ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},${height - padding} L ${points[0].split(',')[0]},${height - padding} Z`}
            fill='url(#gradient-${variant})'
            className='opacity-20'
          />

          {/* Line */}
          <path
            d={`M ${points.join(' L ')}`}
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={cn(
              'transition-colors duration-200',
              getTrendLineColor()
            )}
          />
        </svg>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-modern border transition-all duration-300',
          'hover:shadow-modern-lg hover-lift',
          'p-6',
          variants[variant],
          className
        )}
      >
        <div className='relative'>
          {/* Header */}
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-center space-x-4'>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-modern',
                  'transition-all duration-200 group-hover:scale-105',
                  iconVariants[variant]
                )}
              >
                <div className='h-6 w-6'>{icon}</div>
              </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div
                className={cn(
                  'flex items-center space-x-2 rounded-full px-3 py-1.5 text-xs font-medium',
                  'border transition-all duration-200 backdrop-blur-sm',
                  getTrendColor(trend.isPositive)
                )}
              >
                <span className='flex items-center'>
                  {getTrendIcon(trend.isPositive)}
                </span>
                <span className='font-medium'>{trend.value}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-muted-foreground tracking-wide uppercase'>
              {title}
            </h3>
            <p className='text-3xl font-bold text-card-foreground leading-tight text-balance'>
              {value}
            </p>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {description}
            </p>
          </div>

          {/* Trend Line */}
          {showTrendLine && trendData && (
            <div className='mt-6 pt-4 border-t border-border/40'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground font-medium'>
                  Trend
                </span>
                {generateTrendLine(trendData)}
              </div>
            </div>
          )}

          {/* Subtle hover effect */}
          <div className='absolute inset-0 rounded-modern bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
        </div>
      </div>
    );
  }
);

SummaryCard.displayName = 'SummaryCard';

export default SummaryCard;
