'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outline';
}

export default function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'default',
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variantClasses = {
    default:
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md',
    minimal: 'bg-transparent border-0',
    outline:
      'bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
        relative inline-flex items-center justify-center
        rounded-lg theme-toggle-transition
        focus:outline-none
        hover:scale-105 active:scale-95
        transform-gpu
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Sun icon for light theme */}
      <svg
        className={`w-5 h-5 theme-toggle-transition ${
          theme === 'light'
            ? 'text-yellow-500 rotate-0 scale-100 opacity-100'
            : 'text-gray-400 rotate-90 scale-0 opacity-0'
        }`}
        fill='currentColor'
        viewBox='0 0 20 20'
        xmlns='http://www.w3.org/2000/svg'
        style={{
          transform:
            theme === 'light'
              ? 'rotate(0deg) scale(1)'
              : 'rotate(90deg) scale(0)',
          opacity: theme === 'light' ? 1 : 0,
        }}
      >
        <path
          fillRule='evenodd'
          d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
          clipRule='evenodd'
        />
      </svg>

      {/* Moon icon for dark theme */}
      <svg
        className={`w-5 h-5 absolute theme-toggle-transition ${
          theme === 'dark'
            ? 'text-blue-400 rotate-0 scale-100 opacity-100'
            : 'text-gray-400 -rotate-90 scale-0 opacity-0'
        }`}
        fill='currentColor'
        viewBox='0 0 20 20'
        xmlns='http://www.w3.org/2000/svg'
        style={{
          transform:
            theme === 'dark'
              ? 'rotate(0deg) scale(1)'
              : 'rotate(-90deg) scale(0)',
          opacity: theme === 'dark' ? 1 : 0,
        }}
      >
        <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
      </svg>
    </button>
  );
}
