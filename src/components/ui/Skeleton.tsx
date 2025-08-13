'use client';

import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Skeleton as MuiSkeleton } from '@mui/material';
import { clsx } from 'clsx';

// React Loading Skeleton wrapper with custom styling
interface LoadingSkeletonProps {
  count?: number;
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
  className?: string;
  baseColor?: string;
  highlightColor?: string;
  duration?: number;
  enableAnimation?: boolean;
  circle?: boolean;
  style?: React.CSSProperties;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = 20,
  width,
  borderRadius = 8,
  className,
  baseColor = '#f3f4f6',
  highlightColor = '#e5e7eb',
  duration = 1.5,
  enableAnimation = true,
  circle = false,
  style,
}) => {
  return (
    <Skeleton
      count={count}
      height={height}
      width={width}
      borderRadius={borderRadius}
      className={className}
      baseColor={baseColor}
      highlightColor={highlightColor}
      duration={duration}
      enableAnimation={enableAnimation}
      circle={circle}
      style={style}
    />
  );
};

// Material UI Skeleton wrapper
interface MuiSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  className?: string;
  style?: React.CSSProperties;
}

export const MuiSkeletonComponent: React.FC<MuiSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className,
  style,
}) => {
  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
      style={style}
    />
  );
};

// Dashboard specific skeleton components
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <MuiSkeletonComponent
            variant='text'
            height={32}
            width={200}
            animation='wave'
          />
          <MuiSkeletonComponent
            variant='text'
            height={16}
            width={150}
            animation='wave'
          />
        </div>
        <MuiSkeletonComponent
          variant='rectangular'
          height={40}
          width={120}
          animation='wave'
        />
      </div>

      {/* Summary cards skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700'
          >
            <div className='flex items-center justify-between mb-4'>
              <MuiSkeletonComponent
                variant='text'
                height={20}
                width={100}
                animation='wave'
              />
              <MuiSkeletonComponent
                variant='circular'
                height={16}
                width={16}
                animation='wave'
              />
            </div>
            <MuiSkeletonComponent
              variant='text'
              height={32}
              width={120}
              className='mb-2'
              animation='wave'
            />
            <MuiSkeletonComponent
              variant='text'
              height={14}
              width={80}
              animation='wave'
            />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
        <MuiSkeletonComponent
          variant='text'
          height={24}
          width={150}
          className='mb-4'
          animation='wave'
        />
        <MuiSkeletonComponent
          variant='rectangular'
          height={200}
          width='100%'
          animation='wave'
        />
      </div>

      {/* Table skeleton */}
      <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'>
        <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
          <MuiSkeletonComponent
            variant='text'
            height={24}
            width={120}
            animation='wave'
          />
        </div>
        <div className='p-6'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className='flex items-center space-x-4 py-3'>
              <MuiSkeletonComponent
                variant='text'
                height={16}
                width={60}
                animation='wave'
              />
              <MuiSkeletonComponent
                variant='text'
                height={16}
                width={120}
                animation='wave'
              />
              <MuiSkeletonComponent
                variant='text'
                height={16}
                width={100}
                animation='wave'
              />
              <MuiSkeletonComponent
                variant='text'
                height={16}
                width={80}
                animation='wave'
              />
              <MuiSkeletonComponent
                variant='text'
                height={16}
                width={60}
                animation='wave'
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Card skeleton component
export const CardSkeleton: React.FC<{
  variant?: 'default' | 'summary' | 'minimal';
  className?: string;
}> = ({ variant = 'default', className }) => {
  const baseClasses =
    'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700';

  if (variant === 'summary') {
    return (
      <div className={clsx(baseClasses, 'p-6', className)}>
        <div className='flex items-center justify-between mb-4'>
          <LoadingSkeleton height={20} width={120} />
          <LoadingSkeleton height={16} width={16} circle />
        </div>
        <LoadingSkeleton height={32} width={100} className='mb-2' />
        <LoadingSkeleton height={14} width={80} />
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={clsx(baseClasses, 'p-4', className)}>
        <LoadingSkeleton height={20} width={100} />
        <LoadingSkeleton height={16} width={60} className='mt-2' />
      </div>
    );
  }

  return (
    <div className={clsx(baseClasses, 'p-6', className)}>
      <LoadingSkeleton height={24} width={150} className='mb-4' />
      <LoadingSkeleton height={16} width='100%' className='mb-2' />
      <LoadingSkeleton height={16} width='80%' className='mb-2' />
      <LoadingSkeleton height={16} width='60%' />
    </div>
  );
};

// Table skeleton component
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
        <LoadingSkeleton height={24} width={120} />
      </div>

      {/* Table content */}
      <div className='p-4'>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className='flex items-center space-x-4 py-3'>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                height={16}
                width={
                  colIndex === 0 ? 80 : colIndex === columns - 1 ? 60 : 120
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Form skeleton component
export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 3, className }) => {
  return (
    <div className={clsx('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className='space-y-2'>
          <LoadingSkeleton height={16} width={80} />
          <LoadingSkeleton height={40} width='100%' borderRadius={8} />
        </div>
      ))}
      <div className='flex space-x-3 pt-4'>
        <LoadingSkeleton height={40} width={100} borderRadius={8} />
        <LoadingSkeleton height={40} width={80} borderRadius={8} />
      </div>
    </div>
  );
};

// Profile skeleton component
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Profile header */}
      <div className='flex items-center space-x-4'>
        <LoadingSkeleton height={80} width={80} circle />
        <div className='space-y-2'>
          <LoadingSkeleton height={24} width={150} />
          <LoadingSkeleton height={16} width={100} />
        </div>
      </div>

      {/* Profile form */}
      <FormSkeleton fields={5} />
    </div>
  );
};

// Transaction list skeleton
export const TransactionListSkeleton: React.FC = () => {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'
        >
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <LoadingSkeleton height={16} width={120} />
              <LoadingSkeleton height={14} width={80} />
            </div>
            <div className='text-right space-y-2'>
              <LoadingSkeleton height={16} width={80} />
              <LoadingSkeleton height={14} width={60} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
