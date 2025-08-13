import React from 'react';
import { cn } from '@/lib/utils';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, string | number>[];
  className?: string;
  onRowClick?: (row: Record<string, string | number>) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  (
    {
      columns,
      data,
      className,
      onRowClick,
      sortColumn,
      sortDirection,
      onSort,
      loading = false,
      emptyMessage = 'No data available',
    },
    ref
  ) => {
    const handleSort = (column: string) => {
      if (onSort) {
        onSort(column);
      }
    };

    const getSortIcon = (columnKey: string) => {
      if (sortColumn !== columnKey) {
        return (
          <svg
            className='w-4 h-4 text-secondary-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
            />
          </svg>
        );
      }

      return sortDirection === 'asc' ? (
        <svg
          className='w-4 h-4 text-primary-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 15l7-7 7 7'
          />
        </svg>
      ) : (
        <svg
          className='w-4 h-4 text-primary-500'
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
      );
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div className='overflow-x-auto rounded-lg border border-secondary-200 scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100'>
          <table className='w-full min-w-[800px]'>
            <thead className='bg-secondary-50 border-b border-secondary-200'>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider whitespace-nowrap',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.width && `w-${column.width}`,
                      column.sortable &&
                        'cursor-pointer hover:bg-secondary-100 transition-colors duration-200'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div
                      className={cn(
                        'flex items-center',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span className='ml-1'>{getSortIcon(column.key)}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-secondary-200'>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-6 py-4 text-center text-secondary-500'
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-6 py-8 text-center text-secondary-500'
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'hover:bg-secondary-50 transition-colors duration-200',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 text-sm text-secondary-900 whitespace-nowrap',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

Table.displayName = 'Table';

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ currentPage, totalPages, onPageChange, className }, ref) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between', className)}
      >
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='px-3 py-1 text-sm text-secondary-600 hover:text-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Previous
          </button>
        </div>

        <div className='flex items-center space-x-1'>
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors duration-200',
                page === currentPage
                  ? 'bg-primary-500 text-white'
                  : page === '...'
                    ? 'text-secondary-400 cursor-default'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <div className='flex items-center space-x-2'>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='px-3 py-1 text-sm text-secondary-600 hover:text-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Table;
